import { isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { supabase } from "./supabase";

export const DESKTOP_OAUTH_CALLBACK = "schoice://auth/callback";
export const OAUTH_FLOW_FINISHED_EVENT = "schoice:oauth-flow-finished";

export class AuthOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthOperationError";
  }
}

function safeAuthMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;

  const message = error.message.toLowerCase();
  if (message.includes("network") || message.includes("fetch")) {
    return "無法連線至登入服務，請檢查網路後再試一次。";
  }
  if (message.includes("popup") || message.includes("browser")) {
    return "無法開啟系統瀏覽器，請檢查系統預設瀏覽器設定。";
  }
  return fallback;
}

export async function loginWithGoogle(): Promise<void> {
  const desktop = isTauri();
  const redirectTo = desktop
    ? DESKTOP_OAUTH_CALLBACK
    : `${window.location.origin}/`;

  let authorizationUrl: string | null = null;

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: desktop,
      },
    });

    if (error) throw error;
    authorizationUrl = data.url;
  } catch (error) {
    throw new AuthOperationError(
      safeAuthMessage(error, "無法開始 Google 登入，請稍後再試。"),
    );
  }

  if (!desktop) return;
  if (!authorizationUrl) {
    throw new AuthOperationError("登入服務沒有回傳授權網址，請稍後再試。");
  }

  try {
    await openUrl(authorizationUrl);
  } catch (error) {
    throw new AuthOperationError(
      safeAuthMessage(error, "無法開啟系統瀏覽器，請檢查預設瀏覽器設定。"),
    );
  }
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new AuthOperationError("登出失敗，請檢查網路後再試一次。");
  }
}
