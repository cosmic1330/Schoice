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
  - src/store/SyncDashboard.store.ts
  - src/classes/StockFundamentalQueryBuilder.ts
verified: "2026-10-02"
---

# Data and Synchronization

## Persistence boundary

SQLite is the local analytical store. Its migrations define stock metadata, daily/weekly/hourly OHLCV data, calculated technical indicators, locally mirrored fundamental/investor tables, and the health view used by synchronization.

Supabase is the cloud boundary for authentication and user-owned data such as saved prompts, watch stocks, alarms, trash state, and fundamental filter preferences. It is also a fallback source for fundamental datasets when local coverage is incomplete.

This is a local-first design, not two interchangeable databases. See [ADR-0001](../decisions/0001-local-first-market-data.md).

## Fundamental query fallback

`StockFundamentalQueryBuilder` queries local SQLite first. When a fundamental table contains fewer than the current market-coverage threshold, it fetches that table from Supabase and fills only stock IDs missing locally. Filtering then runs over the merged in-memory data.

Changing the threshold, merge precedence, table mapping, or comparison behavior changes a domain contract and should update this page.

## Synchronization worker protocol

`useSyncLaunch` creates or focuses the `sync-worker` webview. The worker owns its own SQLite connection and initializes its local `SyncEngine` instance. The windows coordinate through these event families:

- lifecycle/commands: `sync:ping`, `sync:worker_ready`, `sync:command_start`, `sync:command_stop`, `sync:worker_closed`;
- telemetry: `sync:status_change`, `sync:log_added`, `sync:stats_update`, `sync:health_map_update`, `sync:total_count_update`.

`SyncDashboard.store` is a per-webview mirror, not the cross-window transport itself. New worker state must define both the emitting event and the receiving store update, with cleanup for every listener.

## Health and update flow

The engine scans `stock_health_view`, classifies stocks, builds a work list, fetches market/fundamental data, and writes through `SyncDatabaseHelper`. Network pacing and freshness behavior are implementation details in `SyncEngine`, `stockSync`, `stockScraper`, and `logFetch`; consult those files before changing retry, concurrency, or cooldown behavior because legacy notes may be stale.

