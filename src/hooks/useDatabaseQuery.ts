import { error } from "@tauri-apps/plugin-log";
import { useCallback, useContext } from "react";
import { DatabaseContext } from "../context/DatabaseContext";

export default function useDatabaseQuery() {
  const { db } = useContext(DatabaseContext);

  const query = useCallback(
    async (sqlQuery: string) => {
      try {
        if (!db) return;
        const res = (await db?.select(sqlQuery)) as any[];
        return res;
      } catch (e) {
        error(`Error executing query: ${e}`);
        return [];
      }
    },
    [db]
  );
  return query;
}
