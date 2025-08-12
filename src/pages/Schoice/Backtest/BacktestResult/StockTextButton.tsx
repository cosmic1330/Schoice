import { Typography } from "@mui/material";
import useDetailWebviewWindow from "../../../../hooks/useDetailWebviewWindow";

export default function StockTextButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const { openDetailWindow } = useDetailWebviewWindow({
    id,
    name,
    group: "",
  });
  return (
    <Typography variant="body2" onClick={openDetailWindow} sx={{ cursor: "pointer" }}>
      {id} {name}
    </Typography>
  );
}
