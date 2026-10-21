---
okf_version: "0.2"
type: concept
title: Data and Synchronization
status: active
source:
  - src-tauri/src/sqlite/migrations.rs
  - src/classes/SyncEngine.ts
  - src/classes/SyncDatabaseHelper.ts
  - src/hooks/useSyncEngine.ts
  - src/hooks/useSyncLaunch.ts
  - src/pages/Detail/index.tsx
  - src/api/marketApi.ts
  - src/api/tdccApi.ts
  - src-tauri/src/commands/chip.rs
  - src-tauri/src/commands/database.rs
  - src/store/SyncDashboard.store.ts
  - src/classes/StockFundamentalQueryBuilder.ts
  - mcp/stockDetailService.ts
verified: "2026-10-17"
---

# Data and Synchronization

## Persistence boundary

SQLite is the local analytical store. Its migrations define stock metadata, daily/weekly/hourly OHLCV data, calculated technical indicators, locally mirrored fundamental/investor tables, and the health view used by synchronization.

Supabase is the cloud boundary for authentication and user-owned data such as saved prompts, watch stocks, alarms, trash state, and fundamental filter preferences. It is also a fallback source for fundamental datasets when local coverage is incomplete.

This is a local-first design, not two interchangeable databases. See [ADR-0001](../decisions/0001-local-first-market-data.md).

## Fundamental query fallback

`StockFundamentalQueryBuilder` queries local SQLite first. When a fundamental table contains fewer than the current market-coverage threshold, it fetches that table from Supabase and fills only stock IDs missing locally. Filtering then runs over the merged in-memory data.

Changing the threshold, merge precedence, table mapping, or comparison behavior changes a domain contract and should update this page.

## Detail workspace data paths

The `/detail/:id` analysis workspace intentionally uses separate paths for separate datasets:

- OHLCV chart history keeps Schoice's existing Yahoo download URL and `tauriFetcher` path, followed by the frontend analyzers in `marketUtils`.
- Institutional, margin, short-sale, and lending data use the native `get_chip_data` Tauri command through `src/api/marketApi.ts`. The Rust command fetches FinMind datasets and maintains its own short-lived in-process cache.
- TDCC holder bands are read from the existing Supabase `tdcc_holder` table through `src/api/tdccApi.ts`.

These paths are not interchangeable. In particular, do not make Detail history depend on the chip-data command or duplicate the native market-history subsystem from another application without an explicit architecture decision.

The local MCP server exposes the synchronized SQLite subset through
`get_stock_detail` and `get_stock_history`. This is intentionally not a claim of
parity with every Detail slide: MCP responses mark TDCC and FinMind chip sections
as unavailable locally until those external paths receive an explicit MCP auth,
cache, and failure contract.

## Synchronization worker protocol

`useSyncLaunch` creates or focuses the `sync-worker` webview. The worker owns its own SQLite connection and initializes its local `SyncEngine` instance. The windows coordinate through these event families:

- lifecycle/commands: `sync:ping`, `sync:worker_ready`, `sync:command_start`, `sync:command_stop`, `sync:worker_closed`;
- telemetry: `sync:status_change`, `sync:log_added`, `sync:stats_update`, `sync:health_map_update`, `sync:total_count_update`.

`SyncDashboard.store` is a per-webview mirror, not the cross-window transport itself. New worker state must define both the emitting event and the receiving store update, with cleanup for every listener.

## Health and update flow

The engine scans `stock_health_view`, classifies stocks, builds a work list, fetches market/fundamental data, and writes through `SyncDatabaseHelper`. Network pacing and freshness behavior are implementation details in `SyncEngine`, `stockSync`, `stockScraper`, and `logFetch`; consult those files before changing retry, concurrency, or cooldown behavior because legacy notes may be stale.

Weekly synchronization keeps the current, not-yet-finalized candle and recalculates a five-week correction buffer. Replacing that buffer is atomic across `weekly_deal` and `weekly_skills`: `SyncDatabaseHelper` prepares the delete and upsert statements, while the native `execute_sql_transaction` command executes them on one SQLite transaction and serializes weekly writes through a single-writer pool. Do not replace this with separate frontend `BEGIN`, write, and `COMMIT` calls—the Tauri SQL plugin uses a connection pool, so separate invocations are not guaranteed to use the same connection.
