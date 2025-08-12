import { Breadcrumbs, Link, Typography } from "@mui/material";
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
    <Breadcrumbs>
      <Link
        underline="hover"
        color="inherit"
        onClick={() => handleLink("/schoice")}
      >
        Schoice
      </Link>
      {pathnames.map((path, index) =>
        index + 1 === pathnames.length ? (
          <Typography
            key={index}
            sx={{ color: "text.primary" }}
            fontWeight="bold"
          >
            {path}
          </Typography>
        ) : (
          <Link
            underline="hover"
            color="inherit"
            onClick={() => handleLink(pathnames.splice(-index).join("/"))}
            key={index}
          >
            {path}
          </Link>
        )
      )}
    </Breadcrumbs>
  );
}
