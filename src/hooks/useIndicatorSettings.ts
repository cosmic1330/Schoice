import { useCallback, useState } from "react";

export interface IndicatorSettings {
  ma5: number;
  ma10: number;
  ma20: number;
  ma60: number;
  boll: number;
  kd: number;
  mfi: number;
  rsi: number;
  ma240: number;
  emaShort: number;
  emaLong: number;
}

const DEFAULT_SETTINGS: IndicatorSettings = {
  ma5: 5,
  ma10: 10,
  ma20: 20,
  ma60: 60,
  boll: 20,
  kd: 9,
  mfi: 14,
  rsi: 5,
  ma240: 240,
  emaShort: 5,
  emaLong: 10,
};

export default function useIndicatorSettings() {
  const [settings, setSettings] = useState<IndicatorSettings>(() => {
    const saved = localStorage.getItem("slitenting-indicator-settings");
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const updateSetting = useCallback(
    (key: keyof IndicatorSettings, value: number) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        localStorage.setItem(
          "slitenting-indicator-settings",
          JSON.stringify(next)
        );
        return next;
      });
    },
    []
  );

  const resetSettings = useCallback(() => {
    localStorage.removeItem("slitenting-indicator-settings");
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, updateSetting, resetSettings };
}
