---
okf_version: "0.2"
type: architecture
title: MCP Server
status: active
source:
  - mcp/
  - src/domain/strategy/
  - src/domain/screening/
  - src/classes/BaseQueryBuilder.ts
  - src/classes/StockDailyQueryBuilder.ts
  - src/classes/StockWeeklyQueryBuilder.ts
  - src/classes/StockHourlyQueryBuilder.ts
verified: "2026-10-21"
---

# MCP Server

## Boundary

Schoice exposes AI-facing capabilities through an App-managed Streamable HTTP
MCP sidecar under `mcp/`. The desktop app starts and stops the sidecar with its
own lifecycle. It binds only to `127.0.0.1:37621`, exposes `/mcp`, rejects every
other Host value and non-loopback browser Origin, and does not require an MCP
connection token. Browser and MCP entry points share pure domain code under
`src/domain/`; runtime-specific database, authentication, and transport code
stays outside that directory. The stdio entry remains available for development.

The local market-data surface is read-only. The server exposes:

- `get_strategy_capabilities` for the authoritative indicator, operator, unit,
  and timeframe catalog;
- `validate_strategy` for deterministic validation and normalization of saved
  or inline strategies;
- `list_strategies` for the authenticated user's non-trashed Supabase
  strategies;
- `create_strategy` for validating and saving a bull or bear strategy under the
  authenticated Supabase user;
- `search_stocks` for resolving stock codes, names, and industries from the
  local catalog;
- `screen_stocks` for intersecting daily, weekly, hourly, and optional
  fundamental conditions against the local SQLite database;
- `get_stock_detail` for a single-stock snapshot containing current technical,
  fundamental, investor-position, and local coverage data;
- `get_stock_history` for bounded OHLCV and caller-selected technical-indicator
  history in chronological order.

Screening compiles only validated timeframes, operators, relative offsets, and
indicator identifiers from the shared capability catalog. Values are bound SQL
parameters, and the database connection is opened read-only with SQLite
`query_only` enabled. Results include the actual selected data date and
condition-level left/right values so an AI can explain why each stock matched.

The two stock-detail tools intentionally cover the SQLite-backed portion of the
Detail workspace. TDCC holder bands remain Supabase-backed, while institutional,
margin, short-sale, and lending analysis remains behind the Tauri/Rust FinMind
command. The snapshot names these unavailable local sections instead of silently
presenting them as missing values. A future MCP extension may add those external
sources with explicit authentication and network behavior.

Do not expose arbitrary SQL or arbitrary URL fetching as MCP tools.

## Mutation boundary

`create_strategy` is the only current write tool. It validates and normalizes
the strategy with the same domain rules used by screening, generates the same
string prompt ID used by the desktop application, and inserts a non-trashed row
into `user_prompts`. It is marked non-read-only and non-idempotent in its MCP
annotations so clients can apply their normal approval behavior. The handler
does not accept `user_id`; it verifies the supplied access token and derives the
owner from that identity.

The App-managed HTTP transport additionally sends each `create_strategy`
request to the desktop host over the sidecar control pipe. The write proceeds
only after the user accepts the native confirmation dialog; rejection or a
two-minute timeout cancels it.

## Local market data

`search_stocks`, `screen_stocks`, `get_stock_detail`, and `get_stock_history`
use the installed Schoice SQLite database.
The default path follows the Tauri application data directory:

- macOS: `~/Library/Application Support/schoice/schoice.db`;
- Windows: `%APPDATA%/schoice/schoice.db`;
- Linux: `$XDG_DATA_HOME/schoice/schoice.db`, falling back to
  `~/.local/share/schoice/schoice.db`.

Set `SCHOICE_DATABASE_PATH` to an explicit database file when the app uses a
different location. Inline screening needs no Supabase configuration. Screening
by `strategy_id` first loads that saved strategy and therefore requires the
user-scoped Supabase credentials below.

## Authentication

There is no bearer token or other MCP transport credential. This is an explicit
local-only trust model: any process already running as the desktop user can call
the endpoint. Loopback binding plus strict Host and Origin validation prevent
remote access and browser DNS-rebinding, but do not isolate mutually untrusted
local processes.

When a tool reads or writes user-owned cloud data, the desktop UI copies its
current Supabase session into a mode-0600 file in the app data directory. The
sidecar rereads it per operation, so login, logout, and token refresh take effect
without a restart. These values authenticate to Supabase, not to MCP:

- `SCHOICE_SUPABASE_URL` (or the existing `VITE_SUPABASE_URL`);
- `SCHOICE_SUPABASE_ANON_KEY` (or the existing `VITE_SUPABASE_ANON_KEY`);
- `SCHOICE_SUPABASE_ACCESS_TOKEN`, containing the signed-in user's short-lived
  access token.

The server verifies the token with Supabase, derives the user ID from that
verified identity, and relies on RLS. Tools must not accept a caller-supplied
user ID. Never configure the MCP server with the Supabase service-role key.
The environment variables remain supported by the standalone stdio development
entry. The packaged App does not require the MCP client to configure them.

Capability lookup, stock search, stock detail/history, inline strategy
validation, and inline screening are local and do not require Supabase
configuration. A saved `strategy_id` does require authentication.

## Development

Run the App-managed HTTP entry with `pnpm mcp:http`, or the standalone stdio
entry with `pnpm mcp`. The desktop build compiles `mcp/http.ts` with Bun into a
target-specific Tauri sidecar so users do not need Bun or Node installed. On the
HTTP sidecar stdout is reserved for App control messages and diagnostics go to
stderr. Verify the separate Node boundary with:

```bash
pnpm mcp:typecheck
pnpm mcp:test
```

The protocol test launches the stdio server with the official MCP client and a
temporary SQLite fixture, then exercises capability discovery, stock search,
detail/history retrieval, validation, and multi-timeframe screening. Tests for
authenticated tools should use a disposable Supabase test user; do not commit
tokens or fixtures containing real user strategies.
