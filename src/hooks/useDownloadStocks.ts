import { error } from "@tauri-apps/plugin-log";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { useCallback, useState } from "react";
import { syncStockMenu } from "../tools/stockSync";

export default function useDownloadStocks() {
  const [disable, setDisable] = useState(false);

  const handleDownloadMenu = useCallback(async () => {
    try {
      setDisable(true);
      await syncStockMenu();
      setDisable(false);
      sendNotification({ title: "Menu", body: "Update Success!" });
    } catch (e) {
      error(`Error updating menu in hook: ${e}`);
      setDisable(false);
    }
  }, []);

  return { handleDownloadMenu, disable };
}
