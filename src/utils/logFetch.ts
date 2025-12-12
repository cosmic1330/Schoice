import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { error, info } from "@tauri-apps/plugin-log";

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
    return response;
  } catch (e: any) {
    error(`[HTTP_PLUGIN][${method}][${requestId}] END Error: ${e}`);
    throw e;
  }
};
