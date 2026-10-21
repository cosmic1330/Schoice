---
okf_version: "0.2"
type: decision
title: ADR-0003 App-managed local MCP server with shared domain services
status: accepted
date: "2026-10-21"
---

# ADR-0003: App-managed local MCP server with shared domain services

## Context

Schoice needs to expose strategy discovery, stock screening, and stock analysis
to AI clients without coupling those clients to React, Tauri windows, arbitrary
SQL, or privileged Supabase credentials. Most strategy and indicator logic is
currently TypeScript, while market data is local-first and user strategies are
protected by Supabase authentication and RLS.

## Decision

Provide an App-managed MCP sidecar over Streamable HTTP using the official
TypeScript MCP SDK. Bind to the fixed loopback endpoint
`http://127.0.0.1:37621/mcp`, validate Host and Origin, and deliberately use no
MCP connection token. The Tauri host owns process startup, shutdown, session
synchronization, and native approval for strategy creation. Retain stdio as a
development-compatible secondary entry.

Compile the HTTP entry into a target-specific Bun executable and bundle it as a
Tauri external binary, so installed applications have no Node or Bun runtime
dependency.

Extract reusable, runtime-neutral strategy and analysis logic into
`src/domain/`, and have both the React application and MCP handlers call that
domain layer.

Local market-data tools are read-only. Explicit user-data mutations such as
`create_strategy` authenticate with a short-lived user access token, verify the
token, derive the user identity from it, and continue to rely on Supabase RLS.
MCP handlers do not accept a user ID and never use a service-role key. Mutation
tools are narrowly scoped and carry accurate MCP read-only, destructive, and
idempotency annotations.

## Alternatives

- Keep stdio as the installed product transport. It avoids a listening socket,
  but prevents a stable URL and makes App-owned sessions and confirmation UI
  harder to coordinate.
- Implement HTTP directly inside Rust. This reduces one process but would
  duplicate or bridge the existing TypeScript strategy and screening code.
- Reimplement the server in Rust. This fits the Tauri host but would duplicate
  the existing TypeScript strategy mappings and analysis logic.
- Expose generic SQL and HTTP tools. This is smaller initially but creates an
  unsafe and unstable public contract and makes AI output difficult to audit.

## Consequences

- AI clients connect to a stable endpoint while Schoice is running; the endpoint
  is intentionally unavailable after the App exits.
- Any process running as the same desktop user can call the tokenless endpoint.
  The security boundary is the machine account plus loopback/Host/Origin checks,
  not MCP authentication.
- Strategy mappings and validators become shared domain contracts instead of UI
  implementation details.
- Supabase-backed calls reuse the live App user session through a private local
  session file. They do not use an MCP token or a service-role credential.
- AI-created strategies use the same durable `user_prompts` representation as
  the desktop application and become visible after its cloud state reloads.
- SQLite-backed Detail data is exposed through a dedicated MCP service; the
  network-backed TDCC and FinMind chip paths still need explicit MCP auth,
  caching, and failure contracts. Screening uses a shared parameterized SQL
  compiler under `src/domain/screening/`.
- Tool outputs must remain structured, bounded, source-attributed, and must not
  provide arbitrary database or network access.
