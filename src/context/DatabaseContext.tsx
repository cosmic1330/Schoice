import Database from "@tauri-apps/plugin-sql";
import { createContext } from "react";

type DbContextType = {
  db: Database | null;
  dates: string[];
  fetchDates?: () => Promise<void>;
};

export const DatabaseContext = createContext<DbContextType>({
  db: null,
  dates: [],
});
