---
okf_version: "0.2"
type: architecture
title: System Overview
status: active
source:
  - src/App.tsx
  - src/context/
  - src/store/
  - src/hooks/useDatabase.ts
  - src/hooks/useSyncLaunch.ts
  - src/pages/Detail/index.tsx
  - src-tauri/src/commands/chip.rs
  - src-tauri/src/lib.rs
  - src-tauri/src/sqlite/recovery.rs
verified: "2026-10-02"
---

# System Overview

## Runtime boundaries

Schoice has three cooperating layers:

1. **React/Vite frontend** — pages, strategy construction, charting, orchestration, and most domain logic live under `src/`.
2. **Tauri host** — `src-tauri/` initializes native plugins, owns application packaging and updater integration, and applies SQLite migrations.
3. **Persistence/services** — local SQLite stores market and computed analysis data; Supabase stores sessions and cloud-owned user data.

The Rust side is intentionally thin. Do not move frontend domain logic into Rust without a concrete native, security, or performance reason. The Detail workspace is one deliberate exception: its FinMind chip-data request is exposed as the native `get_chip_data` command so desktop networking and response caching remain behind a small typed frontend API.

## Routing and application readiness

`src/App.tsx` owns the route tree. `/schoice` is the authenticated application shell and contains the prompt list, favorites, fundamental filter, editor, backtest, trash, and settings routes. `/login`, `/register`, `/detail/:id`, and `/sync-worker` are top-level routes.

`UserProvider` and `DatabaseContext` wrap the router. The `/schoice` shell waits for both a Supabase session and a usable SQLite connection before rendering its nested routes. Route changes should preserve that readiness boundary; not every top-level route is currently auth-gated.

## State ownership

- **React contexts** carry long-lived external resources: Supabase session/user state and the loaded SQLite connection/date lists.
- **Zustand** carries mutable application state: strategy selection and chart state (`Schoice.store`), Supabase-backed user collections (`Cloud.store`), and cross-window synchronization telemetry (`SyncDashboard.store`).
- **Tauri Store** persists small desktop settings such as update/menu preferences and example URLs.
- **`localStorage`** holds lightweight UI preferences such as theme, chart type, and selected example symbol.

Before adding state, choose the narrowest owner. Do not mirror the same authoritative state across Context, Zustand, and Tauri Store.

## Native database lifecycle

`useDatabase` loads `sqlite:schoice.db` through the Tauri SQL plugin. Schema history is defined by ordered migrations in `src-tauri/src/sqlite/migrations.rs`; the latest migration, not prose documentation, defines the installed schema.

Before the SQL plugin preloads the database or the MCP sidecar starts, the `database-recovery` plugin runs the same migrations against `app_config_dir()/schoice.db`, matching the SQL plugin's path. The preflight closes its SQLite pool on both success and failure. The SQL plugin retains migration registration and subsequently verifies the already-applied history.

Migration failures offer an explicit native backup-and-rebuild action. Recovery first builds and migrates a replacement database in a unique `schoice-recovery-*` directory alongside the database. Only after validation succeeds does it move the original database and any `-wal`, `-shm`, and `-journal` files into that directory and install the replacement. File-operation failures attempt to restore files already moved; any restoration failures report the backup location. Backups are retained, never automatically deleted. Cancelling or failed recovery stops startup; successful recovery continues with an empty market database that requires synchronization. Open/permission errors are reported separately and do not offer a reset.

Recovery uses synchronous `rfd` native dialogs before the event loop starts, with the same backend/features already used by the dialog plugin. Do not use Tauri `blocking_show` in this startup hook: it dispatches to the main event loop and can deadlock. No shell commands or platform-specific database paths are used. Migration changes should be verified against both a new and an existing database; recovery regression tests run with `cargo test --manifest-path src-tauri/Cargo.toml sqlite::recovery::tests --lib`.

## Cross-window synchronization

Long-running market synchronization runs in a separate Tauri webview labeled `sync-worker`, opened on `/sync-worker`. The main window and worker coordinate with Tauri events; `SyncDashboard.store` mirrors status for each webview. See [Data and synchronization](../concepts/data-and-synchronization.md) and [ADR-0002](../decisions/0002-dedicated-sync-worker-window.md).
