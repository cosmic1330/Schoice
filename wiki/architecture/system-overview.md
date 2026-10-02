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
  - src-tauri/src/lib.rs
verified: "2026-10-02"
---

# System Overview

## Runtime boundaries

Schoice has three cooperating layers:

1. **React/Vite frontend** — pages, strategy construction, charting, orchestration, and most domain logic live under `src/`.
2. **Tauri host** — `src-tauri/` initializes native plugins, owns application packaging and updater integration, and applies SQLite migrations.
3. **Persistence/services** — local SQLite stores market and computed analysis data; Supabase stores sessions and cloud-owned user data.

The Rust side is intentionally thin. Do not move frontend domain logic into Rust without a concrete native, security, or performance reason.

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

Database migrations are registered by the Tauri builder in `src-tauri/src/lib.rs`. A migration failure prevents normal startup and enters the existing recovery path, so migration edits are high-risk and should be verified against both a new and an existing database.

## Cross-window synchronization

Long-running market synchronization runs in a separate Tauri webview labeled `sync-worker`, opened on `/sync-worker`. The main window and worker coordinate with Tauri events; `SyncDashboard.store` mirrors status for each webview. See [Data and synchronization](../concepts/data-and-synchronization.md) and [ADR-0002](../decisions/0002-dedicated-sync-worker-window.md).

