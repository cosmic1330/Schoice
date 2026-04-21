import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { Box, Button, Typography, alpha, Stack } from "@mui/material";
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
      startIcon={<BookmarkBorderIcon sx={{ fontSize: 18 }} />}
      sx={{
        borderRadius: "100px",
        px: 1.5,
        py: 0.5,
        minWidth: "fit-content",
        bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.08),
        color: "secondary.main",
        border: (theme) => `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
        textTransform: "none",
        "&:hover": {
          bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.15),
          borderColor: (theme) => alpha(theme.palette.secondary.main, 0.3),
        },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="caption" sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>
          {t("Pages.Schoice.Header.filterStocks")}
        </Typography>
        <Box sx={{ 
          px: 0.8, 
          py: 0.1, 
          borderRadius: "4px", 
          bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.12),
          fontSize: "0.7rem",
          fontWeight: 900
        }}>
          {filterStocks.length}
        </Box>
      </Stack>
    </Button>
  );
}
