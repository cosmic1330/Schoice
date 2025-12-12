import Database from '@tauri-apps/plugin-sql';

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
      const db = await Database.load('postgres://root:secret@yangjuiyu.tplinkdns.com:5432/app');
      dbInstance = db; // 連線成功，儲存實例
      return db;
    } catch (error) {
      pendingPromise = null; // 連線失敗，清除 Promise 以便下次重試
      throw error;
    }
  })();

  return pendingPromise;
}