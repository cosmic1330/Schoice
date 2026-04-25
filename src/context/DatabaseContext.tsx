import Database from "@tauri-apps/plugin-sql";
import { createContext } from "react";

type DbContextType = {
  db: Database | null;
  dates: string[];
  weekDates: string[];
  fetchDates?: () => Promise<void>;
  isLoading?: boolean;
  dbType: "sqlite" | "postgres";
  switchDatabase: (type: "sqlite" | "postgres") => Promise<void>;
  isSwitching: boolean;
};

export const DatabaseContext = createContext<DbContextType>({
  db: null,
  dates: [],
  weekDates: [],
  isLoading: false,
  dbType: "sqlite",
  switchDatabase: async () => {},
  isSwitching: false,
});
