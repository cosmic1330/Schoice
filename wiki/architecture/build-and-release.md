---
okf_version: "0.2"
type: architecture
title: Build and Release
status: active
source:
  - package.json
  - vite.config.ts
  - src-tauri/Cargo.toml
  - src-tauri/tauri.conf.json
  - .github/workflows/tauri-updater.yml
verified: "2026-10-02"
---

# Build and Release

## Local workflow

The repository declares pnpm as its package manager. Primary commands are:

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm app
pnpm package
```

- `pnpm build` runs strict TypeScript checking before the Vite production build.
- `pnpm app` runs `tauri dev`; Vite uses fixed port `1420` and fails rather than selecting another port.
- `pnpm package` runs the Tauri build and configured desktop bundlers.

There is currently no repository test script. Do not claim automated test coverage without adding and running an explicit test command.

## Environment inputs

The frontend requires these public Supabase values at build time:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

They are public client configuration, not privileged credentials. Service-role keys and updater signing private keys must remain outside the frontend bundle.

## Version and packaging sources

The user-facing application version appears in both `package.json` and `src-tauri/tauri.conf.json`; release changes should keep them aligned. The Rust crate version in `src-tauri/Cargo.toml` is currently independent and must not be assumed to match the product version.

Tauri is configured to build all bundle targets and create updater artifacts. Local updater artifact generation requires `TAURI_SIGNING_PRIVATE_KEY`; a missing key can make packaging exit unsuccessfully even after an app or installer has been produced.

## CI release flow

`.github/workflows/tauri-updater.yml` is intended to publish from pushes to the `release` branch. It defines macOS ARM/Intel, Ubuntu, and Windows builds through `tauri-apps/tauri-action`, using repository secrets for Supabase configuration and updater signing.

When changing dependencies or release tooling, verify the pnpm version, frozen lockfile, Rust targets, Linux system packages, signing inputs, updater endpoint, and product version together.
