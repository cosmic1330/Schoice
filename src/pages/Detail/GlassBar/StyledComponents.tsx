import { styled, Button, IconButton, Box } from "@mui/material";
import { motion } from "framer-motion";

export const GlassBarContainer = styled(motion.div)(({ theme }) => ({
  position: "absolute",
  left: theme.spacing(0),
  top: "20%",
  transform: "translateY(-50%)",
  background: "rgba(30, 30, 40, 0.6)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderRadius: "16px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
  padding: theme.spacing(1.5),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  zIndex: 10,
}));

export const ControlButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active?: boolean }>(({ active }) => ({
  minWidth: "auto",
  padding: "6px 12px",
  borderRadius: "8px",
  color: active ? "#fff" : "rgba(255, 255, 255, 0.6)",
  backgroundColor: active ? "rgba(255, 255, 255, 0.15)" : "transparent",
  border: active
    ? "1px solid rgba(255, 255, 255, 0.1)"
    : "1px solid transparent",
  fontSize: "0.75rem",
  fontWeight: 600,
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
  },
}));

export const NavIconButton = styled(IconButton)(() => ({
  color: "rgba(255, 255, 255, 0.7)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "8px",
  padding: "6px",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
  },
}));

export const MenuPopup = styled(Box)(() => ({
  position: "absolute",
  left: "100%",
  top: 0,
  display: "none",
  opacity: 0,
  transition: "all 0.2s ease-in-out",
  zIndex: 100,
  whiteSpace: "nowrap",
  paddingLeft: "20px",
  marginLeft: "-15px",
}));

export const MenuContent = styled(Box)(() => ({
  backgroundColor: "rgba(30, 30, 40, 0.9)",
  borderRadius: "8px",
  padding: "4px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
}));
