//@version=5
indicator("Keltner Channel 動態棘輪防線", overlay=true)

// ─────────────────────────────────────────
//  參數設置
// ─────────────────────────────────────────
kcLength   = input.int(20,     "KC 週期 (EMA)", minval=1)
kcMult     = input.float(2.0,  "KC 倍數 (ATR Multiplier)", step=0.1)
atrLength  = input.int(10,     "ATR 週期", minval=1)
useRatchet = input.bool(true,  "開啟棘輪邏輯 (止損只升不降)")

// ─────────────────────────────────────────
//  指標計算
// ─────────────────────────────────────────
float kcMiddle = ta.ema(close, kcLength)
float kcATR    = ta.atr(atrLength)
float kcLower  = kcMiddle - (kcATR * kcMult)

// ─────────────────────────────────────────
//  動態防線邏輯 (棘輪)
// ─────────────────────────────────────────
var float dynamicStop = na

// 假設在持倉狀態下的邏輯 (簡單演示，可整合進 strategy)
if close > kcMiddle
    if useRatchet
        // 棘輪邏輯：取「當前下軌」與「歷史最高止損位」的最大值
        dynamicStop := math.max(kcLower, nz(dynamicStop, kcLower))
    else
        dynamicStop := kcLower
else
    // 價格跌破中軌或失去動能時，可選擇重置或維持
    dynamicStop := useRatchet ? math.max(kcLower, nz(dynamicStop, kcLower)) : kcLower

// 當收盤價跌破動態防線時，標註出場訊號
bool exitSignal = ta.crossunder(close, dynamicStop)

// ─────────────────────────────────────────
//  視覺化
// ─────────────────────────────────────────
plot(kcMiddle, color=color.new(color.gray, 50), title="KC 中軌 (EMA)")
plot(kcLower,  color=color.new(color.blue, 80), title="原始 KC 下軌", style=plot.style_linebr)
plot(dynamicStop, color=color.orange, linewidth=2, title="KC 動態防線 (棘輪)")

plotchar(exitSignal, char="X", location=location.abovebar, color=color.red, size=size.small, title="跌破防線")