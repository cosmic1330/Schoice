---
okf_version: "0.2"
type: decision
title: "ADR-0002: Dedicated sync worker window"
status: active
source:
  - src/hooks/useSyncLaunch.ts
  - src/pages/Schoice/SyncWorker/index.tsx
  - src/classes/SyncEngine.ts
  - src/store/SyncDashboard.store.ts
verified: "2026-10-02"
---

# ADR-0002: Dedicated sync worker window

## Context

Market-wide synchronization is long-running, produces continuous progress/health telemetry, and must not be coupled to the main route component lifecycle. Tauri webviews have separate JavaScript execution contexts, so in-memory singleton and Zustand state are not shared automatically.

## Decision

Run synchronization in a dedicated Tauri webview window labeled `sync-worker` on the `/sync-worker` route. Give the worker its own SQLite connection and `SyncEngine` instance. Use Tauri events as the explicit command, lifecycle, and telemetry protocol between windows.

## Alternatives

- Run the engine inside the main React window.
- Move the whole synchronization engine to Rust commands.
- Use an invisible web worker or service worker.
- Persist progress and poll it from each window.

## Consequences

- The main UI remains independent from the worker component lifecycle.
- Every cross-window state addition requires a defined event and listener cleanup.
- Zustand stores and JavaScript singletons are per webview and must not be mistaken for shared process state.
- Worker readiness needs an explicit handshake before start commands are sent.
- Closing the worker must stop work and notify the main window; visual window-lifecycle changes are architectural changes, not local UI edits.

