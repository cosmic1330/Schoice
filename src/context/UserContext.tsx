import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import useCloudStore from "../store/Cloud.store";
import { supabase } from "../lib/supabase";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

interface UserContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  status: AuthStatus;
  error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [authError, setAuthError] = useState<string | null>(null);
  const { reload } = useCloudStore();

  useEffect(() => {
    let active = true;
    let checkingSession = false;

    const applySession = (nextSession: Session | null) => {
      if (!active) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setAuthError(null);
      setStatus(nextSession ? "authenticated" : "unauthenticated");
    };

    const handleAuthChange = (
      _event: AuthChangeEvent,
      nextSession: Session | null,
    ) => {
      applySession(nextSession);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      handleAuthChange,
    );

    const loadInitialSession = async () => {
      if (checkingSession) return;
      checkingSession = true;
      try {
        const { data: stored, error: sessionError } =
          await supabase.auth.getSession();
        if (!active) return;
        if (sessionError) throw sessionError;

        const expiresSoon =
          stored.session?.expires_at !== undefined &&
          stored.session.expires_at <= Math.floor(Date.now() / 1000) + 60;

        if (expiresSoon) {
          const { data: refreshed, error: refreshError } =
            await supabase.auth.refreshSession();
          if (refreshError) throw refreshError;
          applySession(refreshed.session);
        } else {
          applySession(stored.session);
        }
      } catch {
        if (!active) return;
        setSession(null);
        setUser(null);
        setAuthError("無法讀取登入狀態，請檢查網路後重新登入。");
        setStatus("error");
      } finally {
        checkingSession = false;
      }
    };

    void loadInitialSession();

    const checkWhenVisible = () => {
      if (document.visibilityState === "visible") void loadInitialSession();
    };
    document.addEventListener("visibilitychange", checkWhenVisible);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", checkWhenVisible);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    loading: status === "loading",
    status,
    error: authError,
  };

  useEffect(() => {
    if (user) {
      // 如果有使用者登入，則從 Cloud Store 中載入使用者資料
      reload(user.id);
    }
  }, [user]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
