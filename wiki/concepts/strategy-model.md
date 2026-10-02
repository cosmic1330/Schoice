---
okf_version: "0.2"
type: concept
title: Strategy Model
status: active
source:
  - src/types.ts
  - src/classes/BaseQueryBuilder.ts
  - src/classes/StockDailyQueryBuilder.ts
  - src/classes/StockWeeklyQueryBuilder.ts
  - src/classes/StockHourlyQueryBuilder.ts
verified: "2026-10-02"
---

# Strategy Model

The durable strategy contract is defined in `src/types.ts`:

- `StorePrompt` represents one comparison between time/indicator operands.
- `PromptValue` groups conditions into daily, weekly, and hourly timeframes.
- `PromptItem` wraps a named strategy and its grouped conditions.
- `PromptType` distinguishes the strategy collections used by the UI and cloud store.

The query-builder classes translate these user-facing rules into timeframe-specific expressions and SQL. Their indicator mappings, time options, and operator conversion are part of the strategy contract even though they are not a public network API.

When changing strategy shape or semantics, update the source types first, then audit:

- prompt add/edit and expression generation;
- Supabase serialization in `Cloud.store`;
- all daily/weekly/hourly query builders;
- backtest and result filtering;
- compatibility with previously stored strategies.

Do not duplicate the full indicator list in the wiki; mappings in the query builders are authoritative and change more frequently than the model itself.

