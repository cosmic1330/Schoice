---
okf_version: "0.2"
type: index
title: Schoice Knowledge Base
status: active
verified: "2026-10-02"
---

# Schoice Knowledge Base

## Project Overview

Schoice is a Tauri 2 desktop stock-screening application. React renders the UI, Rust/Tauri hosts native capabilities and SQLite migrations, and Supabase provides authentication plus cloud-owned user data. Source code and executable configuration are authoritative.

## Architecture

- [System overview](architecture/system-overview.md) — runtime layers, routing, state boundaries, persistence, and cross-window sync.
- [Build and release](architecture/build-and-release.md) — local commands, environment inputs, packaging, signing, and CI release flow.

## Core Concepts

- [Data and synchronization](concepts/data-and-synchronization.md) — SQLite/Supabase responsibilities and the worker-window protocol.
- [Strategy model](concepts/strategy-model.md) — durable strategy types and query-builder boundary.
- [Authentication and user data](concepts/authentication-and-user-data.md) — current auth lifecycle, session state, and account deletion boundary.

## Important Decisions

- [ADR-0001: Local-first market data and cloud user data](decisions/0001-local-first-market-data.md)
- [ADR-0002: Dedicated sync worker window](decisions/0002-dedicated-sync-worker-window.md)

## Development Conventions

- Use `pnpm`; TypeScript is strict and production frontend builds run `tsc` before Vite.
- Add SQLite schema changes as ordered Rust migrations; do not edit an installed database ad hoc.
- Keep secrets out of frontend code. Only Vite-prefixed public Supabase configuration belongs in the desktop bundle.
- Read [AGENTS.md](../AGENTS.md) for when this wiki should be updated.

`memory-bank/` is retained as historical material only and may conflict with current source.

