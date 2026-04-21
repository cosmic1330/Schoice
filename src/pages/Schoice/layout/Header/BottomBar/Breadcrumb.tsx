import { Box, Breadcrumbs, Link, Typography, alpha } from "@mui/material";
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
        <Typography
          sx={{ 
            color: "text.disabled", 
            opacity: 0.3, 
            fontSize: "0.75rem",
            mx: 0.5,
            fontWeight: 300 
          }}
        >
          /
        </Typography>
      }
      sx={{
        "& .MuiBreadcrumbs-ol": { alignItems: "center", flexWrap: "nowrap" },
        maxWidth: { xs: "120px", sm: "200px", md: "400px" },
        overflow: "hidden",
      }}
    >
      <Link
        underline="none"
        sx={{
          cursor: "pointer",
          color: "text.secondary",
          fontWeight: 600,
          fontSize: "0.75rem",
          display: "flex",
          alignItems: "center",
          transition: "all 0.2s ease",
          "&:hover": { color: "primary.main" },
          letterSpacing: 0.5,
        }}
        onClick={() => handleLink("/schoice")}
      >
        SCHOICE
      </Link>
      {pathnames.map((path, index) => {
        const isLast = index + 1 === pathnames.length;
        const label = path.toUpperCase();
        
        return isLast ? (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
              px: 1,
              py: 0.3,
              borderRadius: "4px",
              border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            <Typography
              sx={{
                color: "primary.main",
                fontWeight: 900,
                fontSize: "0.7rem",
                letterSpacing: 0.5,
                lineHeight: 1,
              }}
            >
              {label}
            </Typography>
          </Box>
        ) : (
          <Link
            key={index}
            underline="none"
            sx={{
              cursor: "pointer",
              color: "text.secondary",
              fontWeight: 600,
              fontSize: "0.75rem",
              transition: "all 0.2s ease",
              "&:hover": { color: "text.primary" },
              letterSpacing: 0.5,
            }}
            onClick={() => handleLink("/schoice/" + pathnames.slice(0, index + 1).join("/"))}
          >
            {label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
