import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { Box, Button, Typography } from "@mui/material";
import { toast } from "react-toastify";
import useSchoiceStore from "../../../../../../store/Schoice.store";
export default function FilterSelect() {
  const { filterStocks, removeFilterStocks } = useSchoiceStore();
  if (!filterStocks) return <></>;

  const handleClick = () => {
    removeFilterStocks();
    toast.success("已清除基本面塞選");
  };
  return (
    <Button
    size="small"
      variant="contained"
      color="inherit"
      onClick={handleClick}
      startIcon={<BookmarkBorderIcon />}
    >
      <Box>
        <Typography variant="body2">塞選股</Typography>
        <Typography variant="body2" fontWeight={700}>
          {filterStocks.length} 檔
        </Typography>
      </Box>
    </Button>
  );
}
