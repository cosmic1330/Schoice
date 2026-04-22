import { fetchWithLog as fetch } from "../utils/logFetch";

export enum TauriFetcherType {
  Text = "text",
  ArrayBuffer = "arrayBuffer",
}

export const tauriFetcher = async (
  url: string,
  type: TauriFetcherType = TauriFetcherType.Text
) => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    },
  });

  // 檢查 HTTP 狀態碼
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  if (type === TauriFetcherType.Text) return response.text();
  else if (type === TauriFetcherType.ArrayBuffer) return response.arrayBuffer();
  else return response.text();
};
