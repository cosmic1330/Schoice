import { Box, alpha, styled } from "@mui/material";
import { useTranslation } from "react-i18next";

const LangButton = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  padding: "2px",
  borderRadius: "8px",
  background: alpha(theme.palette.text.primary, 0.05),
  border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
  cursor: "pointer",
  transition: "all 0.2s",
  "&:hover": {
    background: alpha(theme.palette.text.primary, 0.1),
    borderColor: alpha(theme.palette.primary.main, 0.4),
  },
}));

const LangTag = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isSelected",
})<{ isSelected?: boolean }>(({ theme, isSelected }) => ({
  fontSize: "0.7rem",
  fontWeight: isSelected ? "bold" : "normal",
  padding: "2px 6px",
  borderRadius: "6px",
  color: isSelected
    ? theme.palette.primary.contrastText
    : alpha(theme.palette.text.primary, 0.5),
  background: isSelected ? theme.palette.primary.main : "transparent",
  fontFamily: "monospace",
  transition: "all 0.2s",
  boxShadow: isSelected
    ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.4)}`
    : "none",
}));

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = () => {
    const nextLang = i18n.language === "en" ? "zh-TW" : "en";
    i18n.changeLanguage(nextLang);
  };

  const isEn = i18n.language === "en";

  return (
    <LangButton onClick={handleLanguageChange}>
      <LangTag isSelected={isEn}>EN</LangTag>
      <LangTag isSelected={!isEn}>繁</LangTag>
    </LangButton>
  );
}
