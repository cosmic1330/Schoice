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

      // 重新啟用憑證偵測：DBeaver 能連線是因為配置了憑證，App 端也需要明確指向這些檔案以建立信任
      try {
        const { resolveResource } = await import("@tauri-apps/api/path");
        const { exists } = await import("@tauri-apps/plugin-fs");

        const certPath = await resolveResource("resources/root.crt");
        const clientCertPath = await resolveResource("resources/client.crt");
        const clientKeyPath = await resolveResource("resources/client.key");

        console.log("Postgres SSL Debug: Resolved certPath ->", certPath);

        if (await exists(certPath)) {
          const connector = pgUrl.includes("?") ? "&" : "?";
          // 嘗試不使用 encodeURIComponent，因為 sqlx 的 URL 解析器可能不支援解碼路徑
          pgUrl += `${connector}sslrootcert=${certPath}`;
          console.log("Postgres SSL: Root CA applied from", certPath);
        } else {
          console.warn("Postgres SSL Warning: root.crt NOT found at", certPath);
        }

        if (await exists(clientCertPath)) {
          const connector = pgUrl.includes("?") ? "&" : "?";
          pgUrl += `${connector}sslcert=${clientCertPath}`;
          console.log("Postgres SSL: Client Cert applied from", clientCertPath);
        }
        if (await exists(clientKeyPath)) {
          const connector = pgUrl.includes("?") ? "&" : "?";
          pgUrl += `${connector}sslkey=${clientKeyPath}`;
          console.log("Postgres SSL: Client Key applied from", clientKeyPath);
        }
      } catch (e) {
        console.error("Postgres SSL Diagnostic Error:", e);
      }

      // 如果 URL 中已經包含 sslmode，則尊重使用者的設定，不再自動補全
      if (!pgUrl.includes("sslmode=")) {
        const connector = pgUrl.includes("?") ? "&" : "?";
        // 如果有 root.crt，預設嘗試 verify-ca，否則用 require
        const mode = pgUrl.includes("sslrootcert=") ? "verify-ca" : "require";
        pgUrl += `${connector}sslmode=${mode}`;
        console.log(
          `Postgres SSL: No sslmode in .env, automatically set to ${mode}`
        );
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
