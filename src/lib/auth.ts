import { supabase } from "./supabase";

export class AuthOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthOperationError";
  }
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new AuthOperationError("登出失敗，請檢查網路後再試一次。");
  }
}
