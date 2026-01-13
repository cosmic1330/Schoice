mod sqlite;
use std::fs;
use tauri::Manager;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use tauri_plugin_store::StoreBuilder;
use tauri_plugin_updater::UpdaterExt;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

async fn update(app: tauri::AppHandle) -> tauri_plugin_updater::Result<()> {
    let app_data_dir = app.path().app_data_dir().unwrap();
    let store_path = app_data_dir.join("store.json");
    let store = StoreBuilder::new(&app.clone(), &store_path)
        .build()
        .map_err(|e| {
            println!("Failed to build store: {}", e);
            tauri_plugin_updater::Error::Io(std::io::Error::new(
                std::io::ErrorKind::Other,
                e.to_string(),
            ))
        })?;

    let auto_update = store.get("autoUpdate").unwrap_or(Some(false).into());
    if !auto_update.as_bool().unwrap_or(false) {
        println!("Auto-update is disabled. Skipping update check.");
        return Ok(());
    }

    if let Some(update) = app.updater()?.check().await? {
        let version = &update.version;

        let ans = app
            .dialog()
            .message(&format!("Update available: v{}", version))
            .kind(MessageDialogKind::Info)
            .buttons(MessageDialogButtons::OkCancel)
            .blocking_show();

        let mut downloaded = 0;
        if ans {
            if let Err(e) = update
                .download_and_install(
                    |chunk_length, content_length| {
                        downloaded += chunk_length;

                        // 修正進度顯示格式
                        let progress = match content_length {
                            Some(total) => {
                                format!(
                                    "downloaded {:.2}%",
                                    (downloaded as f64 / total as f64) * 100.0
                                )
                            }
                            None => format!("{} bytes", downloaded),
                        };
                        println!("{}", progress);
                    },
                    || {
                        println!("download finished");
                    },
                )
                .await
            {
                println!("Download Update failed message: {}", e);
                app.dialog()
                    .message(&format!("Download Update failed: {}", e))
                    .kind(MessageDialogKind::Warning)
                    .buttons(MessageDialogButtons::Ok)
                    .blocking_show();
            } else {
                // 下載完成後，顯示訊息框詢問是否重新啟動應用程式
                println!("Update installed");
                let restart_ans = app
                    .dialog()
                    .message("Update downloaded. Restart now?")
                    .kind(MessageDialogKind::Info)
                    .buttons(MessageDialogButtons::OkCancel)
                    .blocking_show();

                if restart_ans {
                    let exe_path = std::env::current_exe()?;
                    let app_dir = app.path().app_data_dir().map_err(|arg0: tauri::Error| {
                        tauri_plugin_updater::Error::Io(std::io::Error::new(
                            std::io::ErrorKind::Other,
                            arg0.to_string(),
                        ))
                    })?;

                    println!(
                        "執行檔路徑: {:?}\n應用程式資料目錄: {:?}",
                        exe_path, app_dir
                    );
                    app.restart();
                }
            }
        } else {
            println!("User canceled the update.");
        }
    } else {
        println!("No updates available.");
    }

    Ok(())
}

#[tauri::command]
fn get_db_size(app_handle: tauri::AppHandle) -> Result<(u64, String), String> {
    // 取得 app 資料夾下的 sqlite 資料庫路徑
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    let db_path = app_data_dir.join("schoice.db");
    let size = fs::metadata(&db_path)
        .map(|meta| meta.len())
        .map_err(|e| format!("Failed to get db size: {}", e))?;
    Ok((size, db_path.to_string_lossy().to_string()))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let result = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations("sqlite:schoice.db", sqlite::migrations::value())
                .build(),
        )
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                update(handle).await.unwrap();
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, get_db_size])
        .run(tauri::generate_context!());

    if let Err(e) = result {
        eprintln!("Error while running tauri application: {}", e);
        let error_str = e.to_string();
        if error_str.contains("migration") || error_str.contains("duplicate column") {
            // Check for Chinese locale
            let is_chinese = std::process::Command::new("defaults")
                .arg("read")
                .arg("-g")
                .arg("AppleLocale")
                .output()
                .map(|output| {
                    let locale = String::from_utf8_lossy(&output.stdout);
                    locale.trim().starts_with("zh")
                })
                .unwrap_or(false);

            let escaped_error = error_str.replace("\\", "\\\\").replace("\"", "\\\"");
            
            let (title, msg, btn_exit, btn_reset, reset_success) = if is_chinese {
                (
                    "資料庫錯誤",
                    format!(
                        "資料庫遷移失敗。\\n\\n詳細錯誤：{}\\n\\n您的本地資料庫與新版本不相容。\\n您想要重置資料庫嗎？\\n\\n警告：這將刪除所有本地數據。",
                        escaped_error
                    ),
                    "離開",
                    "重置資料庫",
                    "資料庫已重置。請重啟應用程式。"
                )
            } else {
                (
                    "Database Error",
                    format!(
                        "Database migration failed.\\n\\nDetailed error: {}\\n\\nYour local database is incompatible with the new version.\\nWould you like to reset the database?\\n\\nWARNING: This will delete all local data.",
                        escaped_error
                    ),
                    "Exit",
                    "Reset Database",
                    "Database has been reset. Please restart the application."
                )
            };
            
            let script = format!(
                "display dialog \"{}\" with title \"{}\" buttons {{\"chn_wrapper_exit\", \"chn_wrapper_reset\"}} default button \"chn_wrapper_reset\" with icon stop",
                msg, title
            )
            .replace("chn_wrapper_exit", btn_exit)
            .replace("chn_wrapper_reset", btn_reset);

            eprintln!("Attempting to show dialog with script: {}", script);

            let output = std::process::Command::new("/usr/bin/osascript")
                .arg("-e")
                .arg(&script)
                .output();

            match output {
                Ok(out) => {
                    if !out.status.success() {
                        eprintln!("osascript failed: {}", String::from_utf8_lossy(&out.stderr));
                    }
                    let stdout = String::from_utf8_lossy(&out.stdout);
                    if stdout.contains(btn_reset) {
                        let _ = std::process::Command::new("sh")
                            .arg("-c")
                            .arg("rm \"$HOME/Library/Application Support/schoice/schoice.db\"")
                            .output();
                        
                        let success_script = format!(
                            "display dialog \"{}\" buttons {{\"OK\"}} default button \"OK\" with icon note",
                            reset_success
                        );
                        let _ = std::process::Command::new("/usr/bin/osascript")
                            .arg("-e")
                            .arg(&success_script)
                            .output();
                    }
                }
                Err(e) => {
                    eprintln!("Failed to execute osascript: {}", e);
                }
            }
        }
        std::process::exit(1);
    }
}
