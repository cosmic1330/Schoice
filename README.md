# 策略系統說明 (Strategy System)

本系統允許使用者建立自定義選股策略，透過組合多個條件（Prompts）來進行資料篩選。

### StorePrompt 結構

在 `src/types.ts` 中定義的 `StorePrompt` 負責儲存單一個選股條件：

| 欄位 (Field) | 類型     | 說明                                                   | 範例數值                            |
| :----------- | :------- | :----------------------------------------------------- | :---------------------------------- |
| `day1`       | `string` | 第一個運算對象的時間範圍                               | `本週`, `上週`, `3週前`             |
| `indicator1` | `string` | 第一個運算對象的技術指標或數值名稱                     | `收盤價`, `ma5`, `macd`             |
| `operator`   | `string` | 比較運算子 (中文名稱)                                  | `大於`, `小於`, `等於`              |
| `day2`       | `string` | 第二個運算對象的時間範圍，「自定義數值」代表與常數比較 | `本週`, `上週`, `自定義數值`        |
| `indicator2` | `string` | 第二個運算對象的名稱或直接輸入的數字串                 | `收盤價`, `50` (當 day2 為自定義時) |

### 完整策略結構 (`PromptItem`)

一個完整的選股策略由 `PromptItem` 定義，包含名稱與多個時框的條件：

- **`name`**: 策略名稱 (例如："多頭排列且週線轉強")。
- **`conditions` (`PromptValue`)**: 包含三個時框的條件清單：
  - `daily`: 日線級別的 `StorePrompt[]`
  - `weekly`: 週線級別的 `StorePrompt[]`
  - `hourly`: 小時線級別的 `StorePrompt[]`

策略執行時，系統會同時滿足所有指定的時框條件來篩選股票。

## AI 輔助開發說明 (AI Context)

如果你需要讓其他 AI (如 Claude, GPT) 協助編寫策略或理解此系統的邏輯，可以提供以下 Context。此說明不涉及底層資料庫實作，僅專注於邏輯語義：

### 核心概念與結構

系統透過一個名為 `StorePrompt` 的物件定義選股條件，其結構如下：

```typescript
type StorePrompt = {
  day1: string; // 第一個對應的時間點 (例如："本週", "上週")
  indicator1: string; // 第一個對應的技術指標名稱 (例如："收盤價", "ma5")
  operator: string; // 運算子 (例如："大於", "小於")
  day2: string; // 第二個對應的時間點 (或是 "自定義數值")
  indicator2: string; // 第二個對應的技術指標或常數數值
};
```

### 完整策略封裝 (`PromptItem`)

為了產生完整的策略建議，請遵循以下 JSON 結構，這允許跨時框（日/週/時）的條件組合：

```typescript
type PromptItem = {
  name: string; // 策略名稱
  conditions: {
    daily: StorePrompt[]; // 日線條件清單
    weekly: StorePrompt[]; // 週線條件清單
    hourly: StorePrompt[]; // 小時線條件清單
  };
};
```

### 邏輯對應規則

1.  **時間描述 (`day1`, `day2`)**:
    - 採相對時間語義：`本週` (當前), `上週` (n-1), `上上週` (n-2)... 以此類推。
    - 若 `day2` 為 `自定義數值`，則 `indicator2` 應視為一個常數數字。

2.  **指標名稱 (`indicator1`, `indicator2`)**:
    - 基礎價格：`收盤價`, `開盤價`, `最高價`, `最低價`, `成交量`。
    - 均線與衍生項：`ma5`, `ma10`, `ma20`, `ema5`, `ma5扣抵` 等。
    - 技術指標：`macd`, `k`, `d`, `rsi5`, `obv`, `cmf` 等。
    - 專業指標：`轉換線`, `基準線`, `布林上軌`, `週轉率`。

3.  **條件組合原理**:
    - **比較兩個時間點的指標**:
      - 範例：`上週` 的 `收盤價` `大於` `上上週` 的 `收盤價`
      - 資料結構：`{ day1: "上週", indicator1: "收盤價", operator: "大於", day2: "上上週", indicator2: "收盤價" }`
    - **比較指標與常數**:
      - 範例：`本週` 的 `rsi5` `小於` `自定義數值` `20`
      - 資料結構：`{ day1: "本週", indicator1: "rsi5", operator: "小於", day2: "自定義數值", indicator2: "20" }`

### 可選參數清單 (Reference)

針對不同時框的條件 (`daily`, `weekly`, `hourly`)，請參考以下合法的字串值：

#### 1. 時間選項 (`day1`, `day2`)

| 時框 (Timeframe)      | 可選時間值 (Time Options)                                     |
| :-------------------- | :------------------------------------------------------------ |
| **日線 (`daily`)**    | `今天`, `昨天`, `前天`, `3天前`, `4天前`, `5天前`, `其他`     |
| **週線 (`weekly`)**   | `本週`, `上週`, `上上週`, `3週前`, `4週前`, `5週前`           |
| **小時線 (`hourly`)** | `現在`, `1小時前`, `2小時前`, `3小時前`, `4小時前`, `5小時前` |
| **通用**              | `自定義數值` (僅限 `day2` 使用)                               |

> [!NOTE]
> 當日線 `day1` 或 `day2` 設為 `其他` 時，指標必須從「基本面/營收指標」中選擇。

#### 2. 技術指標 (`indicator1`, `indicator2`)

- **基礎價格與成交量**: `收盤價`, `開盤價`, `最高價`, `最低價`, `成交量`
- **移動平均線 (MA/EMA)**: `ma5`, `ma10`, `ma20`, `ma50`, `ma60`, `ma120`, `ma240`, `ema5`, `ema10`, `ema20`, `ema60`, `ema120`, `ema200`
- **MA 扣抵值**: `ma5扣抵`, `ma10扣抵`, `ma20扣抵`, `ma60扣抵`, `ma120扣抵`, `ma240扣抵`, `ma50扣抵`
- **技術指標**:
  - **趨勢**: `macd`, `dif`, `osc`, `adx`, `正向動能`, `負向動能`
  - **強弱/超買超賣**: `k`, `d`, `j`, `rsi5`, `rsi10`, `mfi`
  - **布林通道**: `布林上軌`, `布林中軌`, `布林下軌`
  - **能量/資金流**: `obv`, `obv_ma5`, `obv_ma10`, `obv_ma20`, `obv_ma60`, `obv_ema5`, `obv_ema10`, `obv_ema20`, `obv_ema60`, `cmf`, `cmf_ema5`
  - **一目均衡表**: `轉換線`, `基準線`, `先行帶A`, `先行帶B`, `延遲線`
  - **市場指標**: `週轉率` (單位: %)

#### 3. 運算子 (`operator`)

- `大於`, `小於`, `等於`, `大於等於`, `小於等於`

## Google OAuth 設定

桌面版使用 PKCE、系統預設瀏覽器與 `myapp://auth/callback` deep link 接收 Google 登入結果。

部署前請在 Supabase Dashboard 的 **Authentication → URL Configuration → Redirect URLs** 加入：

```text
myapp://auth/callback
```

網頁開發版若也需要 Google 登入，另加入實際使用的開發網址，例如：

```text
http://localhost:1420/
```

Google Cloud Console 的 OAuth callback 仍應設定為 Supabase 提供的 callback URL，通常是：

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

Google Cloud Console 的 OAuth Client Type 必須選擇 **Web application**。Google 只導回上面的 Supabase HTTPS callback，不要把 `myapp://auth/callback` 加到 Google Cloud Console。

macOS 的 custom scheme 只會在已封裝並安裝到 `/Applications` 的 App 上註冊，因此 `tauri dev` 無法完整測試 deep-link。Windows debug build 與 Linux 會透過 `register_all()` 註冊；Linux AppImage 移動路徑後需重新啟動 App 以更新 `x-scheme-handler` 關聯。

如果登入後被導向 `http://localhost:3000/?code=...`，代表 Supabase 沒有接受傳入的 custom scheme，並退回 Dashboard 目前設定的 Site URL。請確認 `myapp://auth/callback` 已加入上述 Redirect URLs，然後重新開始 OAuth 流程；舊的授權碼不可重複使用。

### OAuth 測試流程

1. App 未開啟：從已封裝、安裝的 App 開始 Google 登入，關閉 App 後在瀏覽器完成授權，確認 callback 重新開啟 App 並登入。
2. App 已開啟：完成 Google 登入後確認回到同一個 instance，且 Header 顯示 email 與 avatar。
3. 在 Google 頁面取消：確認回到登入頁並顯示取消訊息，按鈕可以再次使用。
4. 開啟 `myapp://wrong/path?code=fake`：確認不會交換 Session 或登入。
5. 登入後重啟 App：確認 Session 從安全儲存恢復，過期時自動 refresh。
6. 按登出：確認 Session 清除並回到登入頁。

### OAuth Troubleshooting

- **Supabase redirect URL 不符**：在 Authentication → URL Configuration → Redirect URLs 精確加入 `myapp://auth/callback`；Site URL 不需要改成 custom scheme。
- **Google `redirect_uri_mismatch`**：Google Cloud Console 必須使用 `https://<PROJECT_REF>.supabase.co/auth/v1/callback`，不是 `myapp://...`。
- **deep link 沒有開啟 App**：確認 scheme 是 `myapp` 且 App 已安裝。Windows 可用 `start myapp://auth/callback`，Linux 可用 `xdg-open myapp://auth/callback` 測試 handler。
- **callback 有收到但沒有 Session**：重新開始登入；authorization code 只能使用一次且約五分鐘失效。
- **PKCE code verifier missing**：OAuth 必須由同一個 App installation 開始並完成；清除 App 儲存或同時啟動多個登入流程都會使 verifier 不一致。
- **第二個 App instance 被打開**：確認 `tauri-plugin-single-instance` 保持第一個註冊，並啟用 `deep-link` feature。
- **dev mode 無效**：macOS 無法在 runtime 註冊 scheme，必須 build、安裝至 `/Applications` 後測試；Windows debug 與 Linux 由 `register_all()` 處理。
- **Windows protocol registration**：安裝版會註冊 protocol；開發時先啟動一次 App，若仍失效，檢查登錄檔中的 handler 是否指向目前 executable。
- **macOS URL scheme registration**：檢查封裝 App 的 `Info.plist` 是否包含 `CFBundleURLTypes`，並避免直接測試未安裝的 build artifact。
- **Linux `x-scheme-handler`**：AppImage 移動位置後需重新啟動以更新絕對路徑；桌面環境也必須支援 `xdg-open`。

## 帳號刪除部署

設定頁的「刪除帳號」會呼叫受使用者 JWT 保護的 `delete-account` Edge Function。部署前需套用資料庫 migration 並部署函式：

```bash
supabase db push
supabase functions deploy delete-account
```

`SUPABASE_SERVICE_ROLE_KEY` 僅由 Supabase Edge Function 執行環境讀取，禁止加入前端 `.env` 或打包到 App。
