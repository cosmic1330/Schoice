import { Box, styled } from "@mui/material";
import BottomBar from "./BottomBar";
import TopBar from "./TopBar";

const GridItem = styled(Box)`
  grid-area: header;
  width: 100%;
  border-bottom: 1px solid rgba(0, 0, 0, 0.25);

  // mobile
  @media screen and (max-width: 600px) {
    width: 100%;
  }
`;
export default function Header() {
  return (
    <GridItem>
      <TopBar />
      <BottomBar />
    </GridItem>
  );
}
