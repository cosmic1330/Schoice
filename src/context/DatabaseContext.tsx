import Database from "@tauri-apps/plugin-sql";
import { createContext } from "react";

type DbContextType = {
  db: Database | null;
  dates: string[];
  weekDates: string[];
  fetchDates?: () => Promise<void>;
  isLoading?: boolean;
};

export const DatabaseContext = createContext<DbContextType>({
  db: null,
  dates: [],
  weekDates: [],
  isLoading: false,
});
