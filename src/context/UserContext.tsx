import { Session, User } from "@supabase/supabase-js";
import { load as StoreLoad } from "@tauri-apps/plugin-store";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import useDownloadStocks from "../hooks/useDownloadStocks";
import useCloudStore from "../store/Cloud.store";
import { supabase } from "../tools/supabase";
import { StockTableType } from "../types";

interface UserContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { reload } = useCloudStore();
  const { handleDownloadMenu } = useDownloadStocks();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    loading,
  };

  useEffect(() => {
    if (user) {
      // 如果有使用者登入，則從 Cloud Store 中載入使用者資料
      reload(user.id);
      StoreLoad("store.json", { autoSave: false }).then((store) => {
        store.get("menu").then((menu) => {
          console.log("Loaded menu from store:", menu);
          const menuList = menu as StockTableType[];
          if (!menuList || menuList.length === 0) {
            console.warn("Menu is empty, please update your menu.");
            handleDownloadMenu();
          }
        });
      });
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
