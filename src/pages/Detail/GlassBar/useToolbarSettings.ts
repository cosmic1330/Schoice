import { useEffect } from "react";

export const TOOLBAR_SETTINGS_EVENT = "detail:open-settings";

export default function useToolbarSettings(
  openSettings: (anchor: HTMLElement) => void,
) {
  useEffect(() => {
    const handleOpen = (event: Event) => {
      const anchor = (event as CustomEvent<{ anchor?: HTMLElement }>).detail
        ?.anchor;
      if (anchor) openSettings(anchor);
    };
    window.addEventListener(TOOLBAR_SETTINGS_EVENT, handleOpen);
    return () => window.removeEventListener(TOOLBAR_SETTINGS_EVENT, handleOpen);
  }, [openSettings]);
}
