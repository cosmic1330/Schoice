import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Breadcrumbs, Link, Typography, alpha } from "@mui/material";
import { useLocation, useNavigate } from "react-router";

export default function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname
    .split("/")
    .filter((_, index) => index > 1);
  const navigate = useNavigate();

  const handleLink = (path: string) => {
    navigate(path);
  };

  return (
    <Breadcrumbs
      separator={
        <NavigateNextIcon
          fontSize="small"
          sx={{ color: "text.disabled", opacity: 0.5 }}
        />
      }
      sx={{
        "& .MuiBreadcrumbs-ol": { alignItems: "center" },
      }}
    >
      <Link
        underline="hover"
        sx={{
          cursor: "pointer",
          color: "primary.main",
          fontWeight: 700,
          fontSize: "0.875rem",
          display: "flex",
          alignItems: "center",
          "&:hover": { color: "primary.dark" },
        }}
        onClick={() => handleLink("/schoice")}
      >
        Schoice
      </Link>
      {pathnames.map((path, index) =>
        index + 1 === pathnames.length ? (
          <Typography
            key={index}
            sx={{
              color: "text.primary",
              fontWeight: 800,
              fontSize: "0.875rem",
              bgcolor: (theme) => alpha(theme.palette.text.primary, 0.05),
              px: 1,
              py: 0.2,
              borderRadius: 1,
            }}
          >
            {path}
          </Typography>
        ) : (
          <Link
            underline="hover"
            sx={{
              cursor: "pointer",
              color: "text.secondary",
              fontWeight: 500,
              fontSize: "0.875rem",
              "&:hover": { color: "text.primary" },
            }}
            onClick={() => handleLink(pathnames.slice(0, index + 1).join("/"))}
            key={index}
          >
            {path}
          </Link>
        )
      )}
    </Breadcrumbs>
  );
}
