import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { listen, emit } from "@tauri-apps/api/event";
import { useCallback, useEffect, useState } from "react";
import { useSyncEngine } from "./useSyncEngine";
import useSyncDashboardStore from "../store/SyncDashboard.store";

export const useSyncLaunch = () => {
  const { syncStatus, start } = useSyncEngine();
  const [workerActive, setWorkerActive] = useState(false);

  // 初始化檢查
  useEffect(() => {
    const check = async () => {
      const win = await WebviewWindow.getByLabel("sync-worker");
      setWorkerActive(!!win);
    };
    check();
  }, []);

  // 監聽結束訊號
  useEffect(() => {
    const unlisten = listen("sync:worker_closed", () => {
      setWorkerActive(false);
      const store = useSyncDashboardStore.getState();
      store.setSyncStatus("idle");
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const launch = useCallback(async (forceExtData: boolean = false) => {
    try {
      const label = "sync-worker";
      let workerWin = await WebviewWindow.getByLabel(label);

      const setupReadyListener = () =>
        new Promise<void>((resolve) => {
          const unlisten = listen("sync:worker_ready", () => {
            unlisten.then((fn) => fn());
            resolve();
          });
          emit("sync:ping");
        });

      if (!workerWin) {
        workerWin = new WebviewWindow(label, {
          url: "/sync-worker",
          title: "Schoice Sync Worker",
          width: 800,
          height: 600,
          resizable: true,
          alwaysOnTop: false,
        });

        workerWin.listen("tauri://destroyed", () => {
          setWorkerActive(false);
          useSyncDashboardStore.getState().setSyncStatus("idle");
        });

        await setupReadyListener();
        setWorkerActive(true);
      } else {
        await workerWin.show();
        await workerWin.setFocus();
        await setupReadyListener();
        setWorkerActive(true);
      }

      // 觸發同步引擎啟動
      start(forceExtData);
    } catch (e) {
      console.error("Failed to launch sync worker", e);
    }
  }, [start]);

  return { launch, workerActive, syncStatus };
};
