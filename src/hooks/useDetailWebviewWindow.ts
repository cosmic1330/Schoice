import { emit } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { error, info } from "@tauri-apps/plugin-log";
import { useCallback } from "react";
export default function useDetailWebviewWindow({
  id,
  name,
  group,
}: {
  id: string;
  name: string;
  group: string;
}) {
  const openDetailWindow = useCallback(async () => {
    let existingWindow = await WebviewWindow.getByLabel("detail");

    if (existingWindow) {
      try {
        // 如果窗口已存在，聚焦窗口并更新内容（如果需要）
        await existingWindow.setTitle(`${id} ${name}`);
        // 动态更新 URL
        await emit("detail", { url: `/detail/${id}` });
        await existingWindow.unminimize();
        await existingWindow.show();
        existingWindow.setFocus();
      } catch (e) {
        error(`Error focusing window: ${e}`);
      }
      return;
    } else {
      const webview = new WebviewWindow("detail", {
        title: `${id} ${name} (${group})`,
        url: `/detail/${id}`,
        width: 700,
        height: 500,
      });
      webview.once("tauri://created", function () {});
      webview.once("tauri://error", function (e) {
        info(`Error creating window: ${e}`);
      });
    }
  }, [id, name, group]);

  return { openDetailWindow };
}
