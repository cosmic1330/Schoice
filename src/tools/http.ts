import { fetch } from "@tauri-apps/plugin-http";

export enum TauriFetcherType {
  Text = "text",
  ArrayBuffer = 'arrayBuffer'
}

export const tauriFetcher = async (url: string, type:TauriFetcherType = TauriFetcherType.Text) => {
  const response = await fetch(url, { method: "GET" });

  // 檢查 HTTP 狀態碼
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  if(type===TauriFetcherType.Text) return response.text();
  else if(type ===TauriFetcherType.ArrayBuffer) return  response.arrayBuffer();
  else  return response.text();
};
