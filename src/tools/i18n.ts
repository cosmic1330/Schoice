import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enTranslation from "./locales/en.json";
import zhTranslation from "./locales/zh-tw.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    detection: {
      // 偵測語言的順序
      order: ["querystring", "cookie", "localStorage", "navigator", "htmlTag"],
      // 可選：設定 cookie/localStorage 的 key
      caches: ["localStorage", "cookie"],
    },
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: { translation: enTranslation },
      "zh-TW": { translation: zhTranslation },
    },
  });

export default i18n;
