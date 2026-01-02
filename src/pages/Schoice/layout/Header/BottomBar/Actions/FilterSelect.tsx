import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { Box, Button, Typography, alpha } from "@mui/material";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useUser } from "../../../../../../context/UserContext";
import useCloudStore from "../../../../../../store/Cloud.store";
import useSchoiceStore from "../../../../../../store/Schoice.store";

export default function FilterSelect() {
  const { t } = useTranslation();
  const { filterStocks, setFilterStocks } = useSchoiceStore();
  const { user } = useUser();
  const { setFundamentalCondition } = useCloudStore();

  if (!filterStocks) return <></>;

  const handleClick = () => {
    if (!user) {
      toast.error(t("Pages.Schoice.Header.msgPleaseLogin"));
      return;
    }
    setFilterStocks(null);
    setFundamentalCondition(null, user.id);
    toast.success(t("Pages.Schoice.Header.msgFilterCleared"));
  };

  return (
    <Button
      size="small"
      onClick={handleClick}
      startIcon={<BookmarkBorderIcon />}
      sx={{
        borderRadius: 2,
        px: 2,
        py: 0.8,
        bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1),
        color: "secondary.main",
        "&:hover": {
          bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.2),
        },
      }}
    >
      <Box sx={{ textAlign: "left" }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            display: "block",
            lineHeight: 1,
          }}
        >
          {t("Pages.Schoice.Header.filterStocks")}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 800,
            lineHeight: 1.2,
          }}
        >
          {filterStocks.length} {t("Pages.Schoice.Header.stockUnit")}
        </Typography>
      </Box>
    </Button>
  );
}
