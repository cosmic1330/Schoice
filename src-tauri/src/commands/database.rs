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
                // SQLite has a single writer. Queue all market transactions on one
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
    execute_transaction(pool, statements).await
}

async fn execute_transaction(pool: &SqlitePool, statements: Vec<String>) -> Result<u64, String> {
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

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn market_batches_commit_together_and_roll_back_on_late_failure() {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .unwrap();

        for (period, time_column) in [("daily", "t"), ("hourly", "ts")] {
            for (suffix, value) in [("deal", "c"), ("skills", "ma5")] {
                pool.execute(sqlx::query(&format!(
                    "CREATE TABLE {period}_{suffix} (stock_id TEXT, {time_column} TEXT, {value} REAL CHECK ({value} >= 0), PRIMARY KEY (stock_id, {time_column}))"
                )))
                .await
                .unwrap();
            }
            let deal = |time: &str, value: i32| {
                format!("INSERT OR REPLACE INTO {period}_deal VALUES ('2330', '{time}', {value})")
            };
            let skill = |time: &str, value: i32| {
                format!("INSERT OR REPLACE INTO {period}_skills VALUES ('2330', '{time}', {value})")
            };
            assert_eq!(
                execute_transaction(&pool, vec![deal("1", 100), skill("1", 90)])
                    .await
                    .unwrap(),
                2
            );
            // Fail after overwriting existing rows and inserting new rows.
            assert!(execute_transaction(
                &pool,
                vec![
                    deal("1", 200),
                    deal("2", 300),
                    skill("1", 180),
                    skill("2", -1)
                ]
            )
            .await
            .is_err());
            for (suffix, column, expected) in [("deal", "c", 100.0), ("skills", "ma5", 90.0)] {
                let rows: Vec<(String, f64)> = sqlx::query_as(&format!(
                    "SELECT {time_column}, {column} FROM {period}_{suffix} ORDER BY {time_column}"
                ))
                .fetch_all(&pool)
                .await
                .unwrap();
                assert_eq!(rows, vec![("1".to_string(), expected)]);
            }
            // The pooled connection remains usable after rollback.
            execute_transaction(&pool, vec![deal("2", 300), skill("2", 280)])
                .await
                .unwrap();
        }
        pool.close().await;
    }
}
