import { Store } from "@tauri-apps/plugin-store";

// 封裝成單例
let storeInstance: Store | null = null;

export async function getStore() {
  if (!storeInstance) {
    storeInstance = await Store.load("store.json");

    // 初始化預設欄位（第一次載入時）
    if (!(await storeInstance.has("menu"))) {
      await storeInstance.set("menu", []);
    }
    if (!(await storeInstance.has("autoUpdate"))) {
      await storeInstance.set("autoUpdate", false);
    }
    await storeInstance.save();
  }
  return storeInstance;
}
