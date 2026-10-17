use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::{Executor, SqlitePool};
use std::time::Duration;
use tauri::Manager;
use tokio::sync::OnceCell;

static DATABASE_POOL: OnceCell<SqlitePool> = OnceCell::const_new();

async fn database_pool(app: &tauri::AppHandle) -> Result<&'static SqlitePool, String> {
    DATABASE_POOL
        .get_or_try_init(|| async {
            let db_path = app
                .path()
                .app_config_dir()
                .map_err(|error| error.to_string())?
                .join("schoice.db");
            let options = SqliteConnectOptions::new()
                .filename(db_path)
                .create_if_missing(false)
                .busy_timeout(Duration::from_secs(30));

            SqlitePoolOptions::new()
                // SQLite has a single writer. Queue weekly transactions on one
                // connection instead of making the three-stock sync batch
                // contend for the same file lock.
                .max_connections(1)
                .connect_with(options)
                .await
                .map_err(|error| error.to_string())
        })
        .await
}

#[tauri::command]
pub async fn execute_sql_transaction(
    app: tauri::AppHandle,
    statements: Vec<String>,
) -> Result<u64, String> {
    if statements.is_empty() {
        return Ok(0);
    }

    let pool = database_pool(&app).await?;
    let mut transaction = pool.begin().await.map_err(|error| error.to_string())?;
    let mut rows_affected = 0;

    for statement in statements {
        let result = transaction
            .execute(sqlx::query(&statement))
            .await
            .map_err(|error| error.to_string())?;
        rows_affected += result.rows_affected();
    }

    transaction
        .commit()
        .await
        .map_err(|error| error.to_string())?;
    Ok(rows_affected)
}
