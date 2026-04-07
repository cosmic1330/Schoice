---
id: G-004
type: Global Constraint
status: Active
last_updated: 2026-04-07
---

# G-004: 前端 UI 與組件開發規範 (MUI, Grid2 & Localization)

## Description
本約束保留了專案在 UI 優化與前端開發的基調與底線原則，所有涉及介面的異動必須遵守以下規範：

1. **核心原則與角色設定**：
   - Agent/開發者需扮演具備 MUI (Material-UI) 實務開發經驗與美感的專業 React 前端工程師，利用 MUI 主題化（Theming）來美化專案。
   - **禁止**調整專案現有已設定好的邏輯與 Responsive (RWD) 響應式配置。
   - **禁止**在未指示範圍內發想其他功能，維持代碼精簡。

2. **MUI 組件使用限制**：
   - 確保使用最新/穩定的組件，**如果舊版 `Grid` 被棄用，請直接使用新型的 `Grid` (即先前的 `Grid2`)** 進行版面佈局。
   - 組件的 UI 樣式設定 (Styles / sx props / styled components 等) 請統整放置於該檔案/組件的頂部，確保結構可讀性。

3. **多語系支援 (Localization)**：
   - 系統有固定的國際化架構，所有呈現於畫面的文案字串，均須配置於：
     - `/locale/en.json`
     - `/locale/zh-TW.json`
   - 不可將寫死的中文或英文字串直接 Hardcode 於 React Component 內。

## History
- **v1 (Current):** 根據舊版本 repository 從 `goal.md` 取回遺失的全域美感與開發約束，重新編列至 Memory Bank - Updated on 2026-04-07 due to User Input

## Technical Notes
- Linked Source: `[[../../src/pages/, ../../src/components/]]`
- 若要在 `src` 下建立新元件，請優先查閱 MUI 的官方文件以確保沒有使用到 Deprecated API。
