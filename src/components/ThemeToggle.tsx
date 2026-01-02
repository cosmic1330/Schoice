import { DarkMode, LightMode } from "@mui/icons-material";
import { IconButton, Tooltip, useTheme } from "@mui/material";
import useSchoiceStore from "../store/Schoice.store";

export default function ThemeToggle() {
  const theme = useTheme();
  const { changeTheme } = useSchoiceStore();

  const toggleTheme = () => {
    const nextMode = theme.palette.mode === "light" ? "dark" : "light";
    changeTheme(nextMode);
  };

  return (
    <Tooltip
      title={
        theme.palette.mode === "light" ? "切換至深色模式" : "切換至淺色模式"
      }
    >
      <IconButton onClick={toggleTheme} color="inherit">
        {theme.palette.mode === "light" ? <DarkMode /> : <LightMode />}
      </IconButton>
    </Tooltip>
  );
}
