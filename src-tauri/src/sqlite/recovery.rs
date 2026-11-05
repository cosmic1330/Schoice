use sqlx::{
    migrate::{Migration, MigrationType, Migrator},
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
};
use std::{
    borrow::Cow,
    fs,
    path::{Path, PathBuf},
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tauri::Manager;

fn migrator() -> Migrator {
    Migrator {
        migrations: Cow::Owned(
            super::migrations::value()
                .into_iter()
                .filter(|migration| matches!(migration.kind, tauri_plugin_sql::MigrationKind::Up))
                .map(|migration| {
                    Migration::new(
                        migration.version,
                        migration.description.into(),
                        MigrationType::ReversibleUp,
                        migration.sql.into(),
                        false,
                    )
                })
                .collect(),
        ),
        ..Migrator::DEFAULT
    }
}

#[derive(Debug)]
enum InitializationError {
    Open(String),
    Migration(String),
}

// Always close the pool before a recovery attempts to move files (especially Windows).
async fn initialize(path: &Path, migrations: &Migrator) -> Result<(), InitializationError> {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(
            SqliteConnectOptions::new()
                .filename(path)
                .create_if_missing(true)
                .busy_timeout(Duration::from_secs(30)),
        )
        .await
        .map_err(|error| InitializationError::Open(error.to_string()))?;
    let result = migrations
        .run(&pool)
        .await
        .map_err(|error| InitializationError::Migration(error.to_string()));
    pool.close().await;
    result
}

fn recovery_directory(parent: &Path) -> Result<PathBuf, String> {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_nanos();
    let path = parent.join(format!(
        "schoice-recovery-{timestamp}-{}",
        std::process::id()
    ));
    fs::create_dir(&path).map_err(|error| format!("無法建立備份目錄：{error}"))?;
    Ok(path)
}

fn install_replacement(database: &Path, replacement: &Path, backup: &Path) -> Result<(), String> {
    let mut moved: Vec<(PathBuf, PathBuf)> = Vec::new();
    let result = (|| {
        for suffix in ["", "-wal", "-shm", "-journal"] {
            let mut name = database.as_os_str().to_os_string();
            name.push(suffix);
            let source = PathBuf::from(name);
            match fs::symlink_metadata(&source) {
                Ok(metadata) if metadata.file_type().is_file() => {}
                Ok(_) => return Err(format!("資料庫路徑不是一般檔案：{}", source.display())),
                Err(error)
                    if error.kind() == std::io::ErrorKind::NotFound && !suffix.is_empty() =>
                {
                    continue
                }
                Err(error) => return Err(format!("無法讀取 {}：{error}", source.display())),
            }
            let target = backup.join(source.file_name().ok_or("無效的資料庫檔名")?);
            if target.exists() {
                return Err(format!("備份已存在：{}", target.display()));
            }
            fs::rename(&source, &target)
                .map_err(|error| format!("備份 {} 失敗：{error}", source.display()))?;
            moved.push((source, target));
        }
        fs::rename(replacement, database).map_err(|error| format!("安裝新資料庫失敗：{error}"))
    })();
    if let Err(error) = result {
        let mut rollback_errors = Vec::new();
        for (source, target) in moved.iter().rev() {
            if source.exists() {
                rollback_errors.push(format!("{} 已存在，未覆寫", source.display()));
            } else if let Err(error) = fs::rename(target, source) {
                rollback_errors.push(format!("{}：{error}", source.display()));
            }
        }
        return Err(format!(
            "{error}\n備份位置：{}\n{}",
            backup.display(),
            if rollback_errors.is_empty() {
                "已還原原資料庫。".to_string()
            } else {
                format!(
                    "部分檔案無法還原，請保留備份：{}",
                    rollback_errors.join("；")
                )
            }
        ));
    }
    Ok(())
}

async fn recover(database: &Path) -> Result<PathBuf, String> {
    recover_with(database, &migrator()).await
}

async fn recover_with(database: &Path, migrations: &Migrator) -> Result<PathBuf, String> {
    let backup = recovery_directory(database.parent().ok_or("無效的資料庫路徑")?)?;
    let replacement = backup.join("replacement.db");
    // Validate every migration before touching the original database or its sidecars.
    initialize(&replacement, migrations)
        .await
        .map_err(|error| {
            format!(
                "新資料庫驗證失敗：{error:?}\n原資料庫未替換。\n診斷檔案：{}",
                backup.display()
            )
        })?;
    install_replacement(database, &replacement, &backup)?;
    Ok(backup)
}

// Native synchronous dialogs are used here because the Tauri event loop has not
// started. Tauri's blocking_show dispatches to that loop and would deadlock.
pub fn prepare(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let directory = app.path().app_config_dir()?;
    fs::create_dir_all(&directory)?;
    let database = directory.join("schoice.db");
    match tauri::async_runtime::block_on(initialize(&database, &migrator())) {
        Ok(()) => Ok(()),
        Err(InitializationError::Open(error)) => {
            rfd::MessageDialog::new()
                .set_title("無法開啟資料庫")
                .set_description(format!(
                    "{}\n{error}\n請檢查檔案權限或是否有其他程式使用資料庫。",
                    database.display()
                ))
                .set_level(rfd::MessageLevel::Error)
                .show();
            Err(std::io::Error::other(error).into())
        }
        Err(InitializationError::Migration(error)) => {
            let answer = rfd::MessageDialog::new().set_title("資料庫遷移失敗")
                .set_description(format!("{error}\n\n資料庫：{}\n\n備份並重建會保留舊檔案，建立空白的本機資料庫；市場資料需要重新同步。請先關閉其他 Schoice 程式。", database.display()))
                .set_level(rfd::MessageLevel::Warning)
                .set_buttons(rfd::MessageButtons::YesNoCancelCustom("離開".into(), "備份並重建".into(), "取消".into())).show();
            if answer != rfd::MessageDialogResult::Custom("備份並重建".into()) {
                return Err(std::io::Error::other("使用者取消資料庫恢復").into());
            }
            match tauri::async_runtime::block_on(recover(&database)) {
                Ok(backup) => {
                    rfd::MessageDialog::new().set_title("資料庫已重建")
                        .set_description(format!("新資料庫已通過遷移驗證，將繼續啟動。請重新同步市場資料。\n\n舊資料備份：{}", backup.display())).show();
                    Ok(())
                }
                Err(error) => {
                    rfd::MessageDialog::new()
                        .set_title("資料庫恢復失敗")
                        .set_description(&error)
                        .set_level(rfd::MessageLevel::Error)
                        .show();
                    Err(std::io::Error::other(error).into())
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn fresh_database_and_repeated_startup_apply_all_migrations() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("schoice.db");
        initialize(&path, &migrator()).await.unwrap();
        initialize(&path, &migrator()).await.unwrap();
        let pool = SqlitePoolOptions::new()
            .connect_with(SqliteConnectOptions::new().filename(&path))
            .await
            .unwrap();
        let count: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM _sqlx_migrations WHERE success = 1")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(count as usize, migrator().iter().count());
        pool.close().await;
    }

    #[tokio::test]
    async fn conflicting_schema_is_backed_up_and_rebuilt() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("schoice.db");
        let pool = SqlitePoolOptions::new()
            .connect_with(
                SqliteConnectOptions::new()
                    .filename(&path)
                    .create_if_missing(true),
            )
            .await
            .unwrap();
        sqlx::query("CREATE TABLE daily_deal (legacy_value TEXT)")
            .execute(&pool)
            .await
            .unwrap();
        pool.close().await;
        assert!(matches!(
            initialize(&path, &migrator()).await,
            Err(InitializationError::Migration(_))
        ));
        let original = fs::read(&path).unwrap();
        let backup = recover(&path).await.unwrap();
        assert_eq!(fs::read(backup.join("schoice.db")).unwrap(), original);
        initialize(&path, &migrator()).await.unwrap();
        assert!(!backup.join("replacement.db").exists());
    }

    #[tokio::test]
    async fn broken_replacement_migration_keeps_original_untouched() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("schoice.db");
        fs::write(&path, b"original database").unwrap();
        fs::write(dir.path().join("schoice.db-wal"), b"original wal").unwrap();
        let broken = Migrator {
            migrations: Cow::Owned(vec![Migration::new(
                1,
                "broken".into(),
                MigrationType::ReversibleUp,
                "INVALID SQL".into(),
                false,
            )]),
            ..Migrator::DEFAULT
        };
        assert!(recover_with(&path, &broken).await.is_err());
        assert_eq!(fs::read(&path).unwrap(), b"original database");
        assert_eq!(
            fs::read(dir.path().join("schoice.db-wal")).unwrap(),
            b"original wal"
        );
    }

    #[test]
    fn failed_install_restores_database_and_all_sidecars() {
        let dir = tempfile::tempdir().unwrap();
        let backup = recovery_directory(dir.path()).unwrap();
        for name in [
            "schoice.db",
            "schoice.db-wal",
            "schoice.db-shm",
            "schoice.db-journal",
        ] {
            fs::write(dir.path().join(name), name).unwrap();
        }
        assert!(install_replacement(
            &dir.path().join("schoice.db"),
            &backup.join("missing.db"),
            &backup
        )
        .is_err());
        for name in [
            "schoice.db",
            "schoice.db-wal",
            "schoice.db-shm",
            "schoice.db-journal",
        ] {
            assert_eq!(fs::read(dir.path().join(name)).unwrap(), name.as_bytes());
        }
    }

    #[test]
    fn backup_error_restores_already_moved_files() {
        let dir = tempfile::tempdir().unwrap();
        let backup = recovery_directory(dir.path()).unwrap();
        let path = dir.path().join("schoice.db");
        fs::write(&path, b"old database").unwrap();
        fs::create_dir(dir.path().join("schoice.db-wal")).unwrap();
        let replacement = backup.join("replacement.db");
        fs::write(&replacement, b"new database").unwrap();
        assert!(install_replacement(&path, &replacement, &backup).is_err());
        assert_eq!(fs::read(&path).unwrap(), b"old database");
        assert_eq!(fs::read(&replacement).unwrap(), b"new database");
    }
}
