import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import TourRoundedIcon from "@mui/icons-material/TourRounded";
import { Box, Stack as MuiStack, Typography, styled } from "@mui/material";
import { useState } from "react";
import useSchoiceStore from "../../../../store/Schoice.store";
import { PromptType } from "../../../../types";
const Stack = styled(MuiStack)<{ select: string }>`
  border: ${(props) =>
    props.select === "true"
      ? `1px solid ${props.theme.palette.primary.main}`
      : `1px solid ${props.theme.palette.divider}`};
  padding: 0.5rem;
  border-radius: 10px;
  box-shadow: ${(props) =>
    props.select === "true"
      ? `0 0 2px 1px ${props.theme.palette.primary.main}`
      : `none`};
`;

const IconArea = styled(Box)`
  background-color: ${(props) => props.theme.palette.primary.main};
  // 長寬比例
  aspect-ratio: 1;
  width: 42px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  border-radius: 10px;
  :hover {
    background-color: ${(props) => props.theme.palette.error.main};
    cursor: pointer;
  }
`;

export default function ListItem({
  index,
  id,
  name,
  promptType,
}: {
  index: number;
  id: string;
  name: string;
  promptType: PromptType;
}) {
  const [hover, setHover] = useState(false);
  const { remove, reload, selectObj, select } = useSchoiceStore();
  const handleDelete = (event: React.SyntheticEvent) => {
    event.stopPropagation();
    remove(id, promptType);
    reload();
  };

  const handleSelect = () => {
    selectObj(id, promptType);
  };
  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      onClick={handleSelect}
      select={(select?.id === id).toString() || "false"}
      mb={0.5}
    >
      <IconArea
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={handleDelete}
      >
        {hover ? (
          <DeleteRoundedIcon fontSize="medium" />
        ) : (
          <TourRoundedIcon fontSize="medium" />
        )}
      </IconArea>
      <Box overflow="hidden" flex={1}>
        <Typography
          variant="body2"
          fontWeight="bold"
          noWrap
          textOverflow="ellipsis"
        >
          Prompt {index}: {name}
        </Typography>
        <Typography
          variant="caption"
          color="textSecondary"
          noWrap
          textOverflow="ellipsis"
        >
          {id}
        </Typography>
      </Box>
    </Stack>
  );
}
