OBV 動能趨勢策略與圖表標註規範 (v2.0)
適用週期: 60 分鐘 (短線波段)
核心邏輯: 箱型理論 + OBV 能量潮 + 趨勢過濾 + 攻擊量能

1. 指標參數設定 (Indicator Setup)
   在圖表運算前，請先定義以下變數：

Price Trend (價格趨勢):

- Price_MA: 60MA (20MA 作為短線參考)。
- Resistance (箱頂): 近 20 根 K 棒的最高價。
- Support (箱底): 近 20 根 K 棒的最低價。
- Box_Width (箱體寬度): (Resistance - Support) / AveragePrice < 2% (定義為窄幅盤整)。

OBV Trend (籌碼動能):

- OBV_Value: 當前 K 棒的 OBV 值。
- OBV_MA: OBV 的 20MA (平滑波動)。
- OBV_Slope: OBV 曲線的斜率 (OBV_Value - Previous_OBV)。

Volume Filter (攻擊量):

- Vol_MA: 成交量的 20MA。
- Breakout_Vol: 當前成交量 > Vol_MA \* 1.5 (確認具備攻擊性)。

2. 圖表標註邏輯 (Annotation Logic)
   訊號優先權：A (假突破) > D (轉弱/止損) > B (真突破) > C (吸籌)

A. ⚠️ 假突破 (Fake Breakout) —— 賣出/減碼訊號
邏輯描述：價格突破箱頂，但 OBV 未創高且量能不足。
判斷條件:

1. Close > Resistance (突破箱型)。
2. OBV_Value < 近 20 根 OBV 最高點。
3. (可選) 長上影線或收盤價回落至箱內。
   圖表標註: ▼ 或 ⚠️ | 文字: Fake Breakout (背離) | 顏色: 紅色

B. 🚀 真突破 (True Breakout) —— 強力進場訊號
邏輯描述：價格站穩 60MA，帶量突破箱頂，且 OBV 同步轉強。
判斷條件:

1. Close > Resistance。
2. Close > Price_MA (60MA)。
3. Volume > Vol_MA \* 1.5 (攻擊量)。
4. OBV_Value > OBV_MA 且 OBV_Slope > 0。
   圖表標註: ▲ 或 🚀 | 文字: Buy (量價齊揚) | 顏色: 金色/綠色

C. 🔍 主力吸籌 (Accumulation) —— 潛在機會
邏輯描述：處於窄幅盤整 (Box_Width < 2%)，且 OBV 底底高。
判斷條件:

1. Box_Width < 2% (窄幅)。
2. Close < Resistance (尚未突破)。
3. OBV 呈現 Swing Higher Lows (最近一個局部低點大於前一個)。
   圖表標註: ● 或 ⚡ | 文字: 吸籌中 | 顏色: 藍色

D. 🛑 出場/止損警訊 (Exit/Stop Loss)
邏輯描述：動能消失或跌破關鍵支撐。
判斷條件:

- 轉弱 (Weakness): Close > Price_MA 但 OBV < OBV_MA。
- 止損 (Stop Loss): Price < 前一波訊號 (如 True Breakout) 的 K 棒低點，或 Price < Price_MA 且 OBV 死叉。
  圖表標註: X | 文字: 趨勢轉弱 / 止損 | 顏色: 灰色/橘色

---

## 4. 時區對齊與風險管理

1.  **時區對齊**：OBV 指標在 **60 分鐘 (H1)** 最能體現「主力資金」的進出意圖。標準策略建議在使用 H1 作為進場參考時，同步觀察 **日線 (D1)** 的 OBV 趨勢。若 D1 處於長期底背離吸籌期，則 H1 的真突破 (True Breakout) 勝率將大幅提升。
2.  **風險控制**：
    - **假突破防禦**：若出現 Fake Breakout 標註，應至少減碼 50%，因為資金與價格的背離通常是大幅度回撤的前兆。
    - **移動止損**：在 True Breakout 發生後，以該 K 棒低點或 20MA 作為動態止損位。

---

## 5. 專業提醒

- **無效區過濾**：當市場進入極窄幅盤整、成交量極低時，OBV 的小幅度波動不具代表性，應等待「攻擊量」出現。
