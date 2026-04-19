import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { error, info } from "@tauri-apps/plugin-log";

let globalCoolDownUntil = 0;

export const getCoolDownRemainingMillis = () => Math.max(0, globalCoolDownUntil - Date.now());

export const fetchWithLog = async (
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;
  const method = init?.method || "GET";
  const requestId = Math.random().toString(36).substring(7);

  // 檢查是否處於熔斷冷卻期
  const now = Date.now();
  if (now < globalCoolDownUntil) {
    const remainingSec = Math.ceil((globalCoolDownUntil - now) / 1000);
    const coolDownError = `[BLOCK] 請求被伺服器拒絕，進入安全冷卻期，剩餘 ${remainingSec} 秒。`;
    error(`[HTTP_PLUGIN][${method}][${requestId}] BLOCKED (Cooling Down) ${url}`);
    throw new Error(coolDownError);
  }

  info(`[HTTP_PLUGIN][${method}][${requestId}] START ${url}`);

  try {
    const start = performance.now();
    const response = await tauriFetch(input, init);
    const duration = performance.now() - start;
    info(
      `[HTTP_PLUGIN][${method}][${requestId}] END Status: ${
        response.status
      } (${duration.toFixed(2)}ms)`
    );

    // 如果拿到 429 或 403，主動進入冷卻
    if (response.status === 429 || response.status === 403) {
      error(`[HTTP_PLUGIN][${method}][${requestId}] BLOCKED (Status ${response.status}) Cooling down for 3 mins.`);
      globalCoolDownUntil = Date.now() + 3 * 60 * 1000;
      throw new Error(`[BLOCK] 伺服器回傳狀態 ${response.status}，進入安全冷卻。`);
    }

    return response;
  } catch (e: any) {
    error(`[HTTP_PLUGIN][${method}][${requestId}] END Error: ${e}`);
    
    // 如果發生 RangeError (Status 0)，這通常是 IP 封鎖的徵兆，進入冷卻
    if (String(e).includes("Status must be between")) {
      globalCoolDownUntil = Date.now() + 3 * 60 * 1000;
      error(`[HTTP_PLUGIN][${method}][${requestId}] Detected RangeError (Status 0). Cooling down for 3 mins.`);
      throw new Error(`[BLOCK] 偵測到連線權限異常 (RangeError)，進入安全冷卻。`);
    }
    
    throw e;
  }
};
