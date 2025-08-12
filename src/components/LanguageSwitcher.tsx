import { IconButton } from "@mui/material";
import { useTranslation } from "react-i18next";
import TranslateIcon from "@mui/icons-material/Translate";

export default function LanguageSwitcher() {
  const i18n = useTranslation().i18n;

  const handleLanguageChange = () => {
    if (i18n.language === "en") i18n.changeLanguage("zh-TW");
    else if (i18n.language === "zh-TW") i18n.changeLanguage("en");
  };

  return (
    <IconButton size="small" onClick={handleLanguageChange}>
      <TranslateIcon color={i18n.language === "en" ? "primary" : "inherit"} />
    </IconButton>
  );
}
