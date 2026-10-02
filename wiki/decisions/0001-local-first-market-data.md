---
okf_version: "0.2"
type: decision
title: "ADR-0001: Local-first market data and cloud user data"
status: active
source:
  - src-tauri/src/sqlite/migrations.rs
  - src/store/Cloud.store.ts
  - src/classes/StockFundamentalQueryBuilder.ts
verified: "2026-10-02"
---

# ADR-0001: Local-first market data and cloud user data

## Context

Market time series and calculated indicators are large, read frequently, and must remain usable in a desktop application without making every screen depend on cloud latency. User strategies and watch lists need account-level persistence across installations. Fundamental data exists locally for fast analysis but may be incomplete.

## Decision

Use SQLite as the primary analytical store for stock metadata, time series, indicators, local fundamental mirrors, and synchronization health. Use Supabase for authentication and user-owned cloud data. For fundamental screening, prefer local rows and use Supabase only to fill missing market coverage.

## Alternatives

- Store all market and user data in Supabase.
- Keep all state local and remove account synchronization.
- Treat SQLite and Supabase as equal replicas with bidirectional conflict resolution.

## Consequences

- Core analysis is fast and resilient to cloud availability.
- SQLite schema and synchronization correctness are central compatibility concerns.
- User data needs Supabase authorization policies and explicit reload/update behavior.
- Fundamental merge precedence and completeness thresholds are domain behavior, not incidental implementation details.
- The system accepts synchronization complexity instead of introducing a general-purpose replication layer.

