import type { Session, User } from "@supabase/supabase-js";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrent, onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { supabase } from "./supabase";

const EXPECTED_PROTOCOL = "schoice:";
const EXPECTED_HOST = "auth";
const EXPECTED_PATH = "/callback";

const processedCodes = new Set<string>();
let processingOAuthCode: string | null = null;

export type OAuthCallbackResult =
  | { status: "success"; session: Session; user: User }
  | { status: "error"; message: string }
  | { status: "ignored" }
  | { status: "duplicate" };

type ParsedCallback =
  | { kind: "code"; code: string }
  | { kind: "error"; message: string }
  | { kind: "ignored" };

function callbackParams(url: URL): URLSearchParams {
  const params = new URLSearchParams(url.search);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));

  hashParams.forEach((value, key) => {
    if (!params.has(key)) params.set(key, value);
  });

  return params;
}

function oauthErrorMessage(params: URLSearchParams): string | null {
  const error = params.get("error");
  const errorCode = params.get("error_code");

  if (!error && !errorCode && !params.get("error_description")) return null;
  if (error === "access_denied" || errorCode === "access_denied") {
    return "你已取消 Google 登入。";
  }

  return errorCode
    ? `Google 登入失敗（${errorCode}），請重新嘗試。`
    : "Google 登入失敗，請重新嘗試。";
}

export function parseOAuthCallback(rawUrl: string): ParsedCallback {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { kind: "ignored" };
  }

  if (
    url.protocol !== EXPECTED_PROTOCOL ||
    url.hostname !== EXPECTED_HOST ||
    url.pathname !== EXPECTED_PATH
  ) {
    return { kind: "ignored" };
  }

  const params = callbackParams(url);
  const providerError = oauthErrorMessage(params);
  if (providerError) return { kind: "error", message: providerError };

  const code = params.get("code");
  if (!code) {
    return {
      kind: "error",
      message: "登入回傳缺少授權碼，請重新開始 Google 登入。",
    };
  }

  return { kind: "code", code };
}

function exchangeErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "無法完成 Google 登入，請重新嘗試。";
  }

  const message = error.message.toLowerCase();
  if (message.includes("code verifier") || message.includes("pkce")) {
    return "登入驗證資料已遺失或過期，請回到登入頁重新開始。";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "無法連線至登入服務，請檢查網路後重新登入。";
  }
  return "授權碼無效或已使用，請重新開始 Google 登入。";
}

export async function handleOAuthCallback(
  rawUrl: string,
): Promise<OAuthCallbackResult> {
  const parsed = parseOAuthCallback(rawUrl);
  if (parsed.kind === "ignored") return { status: "ignored" };
  if (parsed.kind === "error") {
    return { status: "error", message: parsed.message };
  }

  if (processingOAuthCode === parsed.code || processedCodes.has(parsed.code)) {
    return { status: "duplicate" };
  }

  processingOAuthCode = parsed.code;
  processedCodes.add(parsed.code);

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(
      parsed.code,
    );

    if (error) throw error;
    if (!data.session || !data.user) {
      return {
        status: "error",
        message: "登入完成但沒有取得使用者 Session，請重新登入。",
      };
    }

    return {
      status: "success",
      session: data.session,
      user: data.user,
    };
  } catch (error) {
    return { status: "error", message: exchangeErrorMessage(error) };
  } finally {
    if (processingOAuthCode === parsed.code) processingOAuthCode = null;
  }
}

export async function listenForOAuthDeepLinks(
  onResult: (result: OAuthCallbackResult) => void,
): Promise<() => void> {
  if (!isTauri()) return () => undefined;

  const processUrls = (urls: string[]) => {
    urls.forEach((url) => {
      void handleOAuthCallback(url).then(onResult);
    });
  };

  // Register first so a callback arriving during initialization cannot be lost.
  const unlisten = await onOpenUrl(processUrls);
  try {
    const currentUrls = await getCurrent();
    if (currentUrls) processUrls(currentUrls);
  } catch (error) {
    unlisten();
    throw error;
  }

  return unlisten;
}
