import {
  DragIndicator,
  HelpOutline,
  KeyboardArrowDown,
  KeyboardArrowUp,
  UnfoldLess,
  UnfoldMore,
} from "@mui/icons-material";
import { Box, IconButton, Tooltip } from "@mui/material";
import React from "react";
import { NavIconButton } from "./StyledComponents";

interface NavigationProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  current: number;
  goToSlide: (index: number) => void;
  onOpenDoc: () => void;
}

const TIMEZONE_ALIGNMENT_MAP: Record<number, string> = {
  0: "布林通道在日線 (D1) 的有效性最高，標準參數 (20, 2) 在此週期下能過濾多數噪音。若切換至 1 小時 (H1)，需搭配更高週期的趨勢（如日線中軌方向）進行過濾。",
  1: "MA 策略在日線 (D1) 最能體現「趨勢的力量」。在週線 (W1)，MA 20 (月線) 具有極強的防禦屬性。若在 1 小時 (H1) 看到跳空缺口，應先檢查 D1 是否處於關鍵支撐位，避免在長線壓力區追多短線缺口。",
  2: "EMA 策略在日線 (D1) 提供穩定的中長線指南。若要在 H1 進場，請務必先確認 D1 的價格是否在 EMA 60 或 SMA 200 支撐位附近。",
  3: "OBV 指標在 60 分鐘 (H1) 最能體現「主力資金」的進出意圖。建議在 H1 作為進場參考時，同步觀察日線 (D1) 的 OBV 趨勢。若 D1 處於長期底背離吸籌期，則 H1 的真突破勝率大幅提升。",
  4: "MJ 策略在 1 小時 (H1) 極具實戰價值，能捕捉到日內波段的明確起漲點。在 15 分鐘 (M15) 時，交叉會非常頻繁，此時必須嚴格遵守「只做與日線方向一致」的訊號。",
  5: "MR 策略在 15 分鐘 (M15) 與 30 分鐘 (M30) 非常神準，適合用於捕捉日內強勢攻擊波段。在日線 (D1)，MR 用於判斷動能衰竭。若 M15 出現金叉但日線 RSI 在 50 以下，應以「搶反彈」視之。",
  6: "KD 指標對時間極敏感。在週線 (W1) 或日線 (D1) 具有極高波段參考價值；在 15 分鐘 (M15) 等短時區，容易發生鈍化，必須搭配趨勢指標 (如 MA20) 過濾。",
  7: "MFI 在日線 (D1) 非常穩健，用於判別大資金進盤與離巢。在 1 小時 (H1) 或 15 分鐘 (M15) 反應迅速，常用於捕捉情緒極點。建議 H1 出現超賣時進場，但須確保 D1 趨勢仍向上。",
  8: "一目均衡表在日線 (D1) 與週線 (W1) 最有效。如果在 15 分鐘或 1 小時圖使用，CMF 的噪音會淹沒所有訊號。",
};

const Navigation: React.FC<NavigationProps> = ({
  isCollapsed,
  setIsCollapsed,
  current,
  goToSlide,
  onOpenDoc,
}) => {
  return (
    <>
      {/* Drag Handle */}
      <Box
        sx={{
          cursor: "grab",
          display: "flex",
          justifyContent: "center",
          width: "100%",
          py: 0.2,
        }}
      >
        <DragIndicator
          style={{ fontSize: 16, color: "rgba(255,255,255,0.3)" }}
        />
      </Box>

      {/* Collapse Toggle */}
      <IconButton
        onClick={() => setIsCollapsed(!isCollapsed)}
        size="small"
        sx={{
          p: 0.5,
          color: "rgba(255,255,255,0.5)",
          "&:hover": {
            color: "#fff",
            bgcolor: "rgba(255,255,255,0.1)",
          },
        }}
      >
        {isCollapsed ? (
          <UnfoldMore fontSize="small" />
        ) : (
          <UnfoldLess fontSize="small" />
        )}
      </IconButton>

      {/* Info/Help Button with Tooltip */}
      <Tooltip
        title={
          <Box sx={{ p: 0.5 }}>
            <Box
              sx={{
                fontWeight: "bold",
                mb: 0.5,
                borderBottom: "1px solid rgba(255,255,255,0.2)",
                pb: 0.5,
              }}
            >
              時區對齊建議
            </Box>
            <Box sx={{ fontSize: "0.75rem", lineHeight: 1.4 }}>
              {TIMEZONE_ALIGNMENT_MAP[current] || "點擊查看文件"}
            </Box>
          </Box>
        }
        placement="right"
        arrow
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: "rgba(20, 25, 35, 0.95)",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
              maxWidth: 250,
            },
          },
          arrow: {
            sx: {
              color: "rgba(20, 25, 35, 0.95)",
            },
          },
        }}
      >
        <IconButton
          onClick={onOpenDoc}
          size="small"
          sx={{
            p: 0.5,
            color: "primary.main",
            "&:hover": {
              color: "#fff",
              bgcolor: "rgba(144, 202, 249, 0.1)",
            },
          }}
        >
          <HelpOutline fontSize="small" />
        </IconButton>
      </Tooltip>

      {!isCollapsed && (
        <>
          <Box
            sx={{
              width: "20px",
              height: "1px",
              backgroundColor: "rgba(255,255,255,0.1)",
              my: 0.5,
            }}
          />
          {/* Navigation Arrows */}
          <NavIconButton onClick={() => goToSlide(current - 1)} size="small">
            <KeyboardArrowUp fontSize="small" />
          </NavIconButton>
          <NavIconButton onClick={() => goToSlide(current + 1)} size="small">
            <KeyboardArrowDown fontSize="small" />
          </NavIconButton>
        </>
      )}
    </>
  );
};

export default Navigation;
