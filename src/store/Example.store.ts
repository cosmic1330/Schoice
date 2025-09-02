import { Store } from "@tauri-apps/plugin-store";
import { UrlTaPerdOptions } from "../types";

// 封裝成單例
let storeInstance: Store | null = null;

export async function getStore() {
  if (!storeInstance) {
    storeInstance = await Store.load("example.json");

    // 初始化預設欄位（第一次載入時）
    if (!(await storeInstance.has(UrlTaPerdOptions.Day))) {
      await storeInstance.set(UrlTaPerdOptions.Day, "");
    }
    if (!(await storeInstance.has(UrlTaPerdOptions.Hour))) {
      await storeInstance.set(UrlTaPerdOptions.Hour, "");
    }
    if (!(await storeInstance.has(UrlTaPerdOptions.Week))) {
      await storeInstance.set(UrlTaPerdOptions.Week, "");
    }
    await storeInstance.save();
  }
  return storeInstance;
}
