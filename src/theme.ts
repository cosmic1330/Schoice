import { createTheme, ThemeOptions } from "@mui/material/styles";

const ink = "#202027";
const blue = "#5BB9E9";
const pink = "#FF9FC5";
const yellow = "#FFD96A";

const shared: ThemeOptions = {
  shape: { borderRadius: 18 },
  typography: {
    fontFamily:
      'ui-rounded, "Arial Rounded MT Bold", "Nunito", "PingFang TC", "Microsoft JhengHei", sans-serif',
    h1: { fontWeight: 900 },
    h2: { fontWeight: 900 },
    h3: { fontWeight: 900 },
    h4: { fontWeight: 900 },
    h5: { fontWeight: 900 },
    h6: { fontWeight: 900 },
    button: { textTransform: "none", fontWeight: 900, letterSpacing: 0.2 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*": { boxSizing: "border-box" },
        body: {
          margin: 0,
          transition: "background-color .25s ease",
          scrollbarColor: `${pink} transparent`,
        },
        "*::-webkit-scrollbar": { width: 9, height: 9 },
        "*::-webkit-scrollbar-thumb": {
          background: pink,
          border: `2px solid ${ink}`,
          borderRadius: 99,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: `2px solid ${ink}`,
          boxShadow: `4px 4px 0 rgba(32,32,39,.22)`,
        },
        rounded: { borderRadius: 22 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `2px solid ${ink}`,
          boxShadow: `5px 5px 0 ${ink}`,
          overflow: "hidden",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          padding: "8px 18px",
          border: `2px solid ${ink}`,
          boxShadow: `3px 3px 0 ${ink}`,
          transition: "transform .15s ease, box-shadow .15s ease",
          "&:hover": {
            boxShadow: `1px 1px 0 ${ink}`,
            transform: "translate(2px, 2px)",
          },
          "&:active": { boxShadow: "none", transform: "translate(3px, 3px)" },
        },
        text: { borderColor: "transparent", boxShadow: "none" },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          transition: "transform .15s ease, background-color .15s ease",
          "&:hover": { transform: "rotate(-3deg) scale(1.06)" },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { border: `2px solid ${ink}`, fontWeight: 800 } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { border: `3px solid ${ink}`, boxShadow: `8px 8px 0 ${ink}` },
      },
    },
    MuiTextField: { defaultProps: { variant: "outlined" } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: "rgba(255,255,255,.48)",
          "& .MuiOutlinedInput-notchedOutline": { borderWidth: 2, borderColor: ink },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: pink },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderWidth: 3 },
        },
      },
    },
    MuiSelect: {
      styleOverrides: { select: { fontWeight: 800 } },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 6, borderRadius: "999px 999px 0 0", backgroundColor: pink },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 900,
          "&.Mui-selected": { color: ink },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: `2px solid ${ink}`,
          borderRadius: "999px !important",
          fontWeight: 900,
          "&.Mui-selected": { background: blue, color: ink },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: { border: `2px solid ${ink}`, borderRadius: 18, overflow: "hidden" },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { background: yellow, color: ink, fontWeight: 900, borderBottom: `2px solid ${ink}` },
        root: { borderBottom: "1.5px solid rgba(32,32,39,.18)" },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          border: `2px solid ${ink}`,
          borderRadius: "18px !important",
          boxShadow: `3px 3px 0 ${ink}`,
          marginBottom: 10,
          overflow: "hidden",
          "&::before": { display: "none" },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { border: `2px solid ${ink}`, borderRadius: 16, fontWeight: 800 },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { border: `2px solid ${ink}`, boxShadow: `5px 5px 0 ${ink}`, marginTop: 6 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { borderRadius: 10, margin: "3px 6px", fontWeight: 700, "&.Mui-selected": { background: blue } },
      },
    },
    MuiCheckbox: { styleOverrides: { root: { color: ink } } },
    MuiRadio: { styleOverrides: { root: { color: ink } } },
    MuiSwitch: {
      styleOverrides: {
        track: { border: `2px solid ${ink}`, opacity: 1 },
        thumb: { border: `2px solid ${ink}`, boxShadow: "none" },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          border: `2px solid ${ink}`,
          borderRadius: 12,
          background: ink,
          fontWeight: 800,
        },
      },
    },
  },
};

const lightThemeOptions: ThemeOptions = {
  ...shared,
  palette: {
    mode: "light",
    primary: { main: blue, light: "#99D9F5", dark: "#319ACF", contrastText: ink },
    secondary: { main: pink, contrastText: ink },
    warning: { main: yellow },
    success: { main: "#7BCB8B" },
    error: { main: "#F15F55" },
    text: { primary: ink, secondary: "#66606A" },
    background: { default: "#FFF8F5", paper: "#FFFEFA" },
    divider: "rgba(32, 32, 39, .16)",
  },
};

const darkThemeOptions: ThemeOptions = {
  ...shared,
  palette: {
    mode: "dark",
    primary: { main: "#70C9F1", contrastText: ink },
    secondary: { main: "#FF9FC5", contrastText: ink },
    warning: { main: yellow },
    success: { main: "#86D89A" },
    error: { main: "#FF7970" },
    text: { primary: "#FFF9F0", secondary: "#D1C6CB" },
    background: { default: "#252334", paper: "#343145" },
    divider: "rgba(255, 249, 240, .18)",
  },
};

export const getTheme = (mode: "light" | "dark") =>
  createTheme(mode === "light" ? lightThemeOptions : darkThemeOptions);
