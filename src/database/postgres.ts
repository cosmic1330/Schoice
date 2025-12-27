import Database from "@tauri-apps/plugin-sql";

let dbInstance: Database | null = null;
let pendingPromise: Promise<Database> | null = null;

export default async function getDbInstance(): Promise<Database> {
  // 1. 如果資料庫已經連線成功，直接回傳實例
  if (dbInstance) {
    return dbInstance;
  }

  // 2. 如果正在連線中（但尚未完成），回傳正在進行的 Promise
  // 這可以防止短時間內重複觸發 Database.load
  if (pendingPromise) {
    return pendingPromise;
  }

  // 3. 發起新的連線請求
  pendingPromise = (async () => {
    try {
      let pgUrl = (
        import.meta.env && (import.meta.env.VITE_POSTGRES_URL as string)
      )?.trim();

      // 移除可能多餘的 '&' 或 '?'（例如 VITE_POSTGRES_URL 結尾的 &）
      pgUrl = pgUrl.replace(/[&?]+$/g, "");

      if (!pgUrl) {
        throw new Error("VITE_POSTGRES_URL is not defined in .env");
      }

      // 強制檢查是否有 sslmode，如果沒有則補上
      if (!pgUrl.includes("sslmode=")) {
        const connector = pgUrl.includes("?") ? "&" : "?";
        pgUrl += `${connector}sslmode=require`;
      }

      // 嘗試偵測是否有憑證檔案
      try {
        const { resolveResource } = await import("@tauri-apps/api/path");
        const { exists } = await import("@tauri-apps/plugin-fs");

        const certPath = await resolveResource("resources/server-ca.crt");

        if (await exists(certPath)) {
          const connector = pgUrl.includes("?") ? "&" : "?";
          pgUrl += `${connector}sslrootcert=${certPath}`;
        }
      } catch (e) {
        console.warn("Postgres SSL Certificate detection skipped:", e);
      }

      // 強制檢查是否有 sslmode，如果沒有則補上
      if (!pgUrl.includes("sslmode=")) {
        const connector = pgUrl.includes("?") ? "&" : "?";
        pgUrl += `${connector}sslmode=require`;
      }

      // 調試日誌：檢查 URL 各部分，確認資料庫名稱是否正確被切分
      const urlMatch = pgUrl.match(/postgres:\/\/.*\/([^?]+)(\?.*)?/);
      console.log(
        "Postgres DB Debug: Target Database ->",
        urlMatch ? urlMatch[1] : "NOT FOUND"
      );

      // 重要：日誌記錄最終傳遞給 Database.load 的 URL (隱藏密碼)
      console.log(
        "Postgres DB: Attempting connection to URL:",
        pgUrl.replace(/:([^:@]+)@/, ":****@")
      );

      const db = await Database.load(pgUrl);
      dbInstance = db; // 連線成功，儲存實例
      return db;
    } catch (error) {
      pendingPromise = null; // 連線失敗，清除 Promise 以便下次重試
      throw error;
    }
  })();

  return pendingPromise;
}
