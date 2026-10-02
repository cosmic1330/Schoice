---
okf_version: "0.2"
type: concept
title: Authentication and User Data
status: active
source:
  - src/lib/supabase.ts
  - src/context/UserContext.tsx
  - src/pages/Login/Content.tsx
  - src/pages/Register/Content.tsx
  - src/store/Cloud.store.ts
  - src/pages/Schoice/Setting/DeleteAccount.tsx
  - supabase/functions/delete-account/index.ts
verified: "2026-10-02"
---

# Authentication and User Data

## Current authentication flow

The current source tree uses Supabase email/password sign-in and sign-up. The Supabase client persists sessions and refreshes tokens using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

`UserProvider` is the single React auth-state owner. It exposes `loading`, `authenticated`, `unauthenticated`, and `error` states; subscribes once to Supabase auth changes; restores the stored session; and refreshes sessions near expiry. On authentication it reloads user-owned collections into `Cloud.store`.

There is no Google OAuth, deep-link plugin, or system-browser callback flow in the current executable configuration. Do not infer one from historical discussion or stale documentation; adding OAuth is an authentication architecture change and requires updating this page.

## Authorization boundary

Frontend operations pass the authenticated user ID when reading or mutating user-owned Supabase rows. Database authorization must still be enforced by Supabase policies; client-side filtering is not a security boundary. `superbase_schema.sql`, deployed migrations, and the live Supabase project must be reviewed together before changing authorization behavior.

## Account deletion

Settings invokes the authenticated `delete-account` Edge Function. The function validates the caller with the anon client, then uses `SUPABASE_SERVICE_ROLE_KEY` only inside the function to delete that same Auth user. The service-role key must never enter Vite environment variables or desktop code.

The accompanying Supabase migration adds cascading foreign keys for user-owned tables. Deploy the migration before the function so Auth deletion cannot strand dependent rows.

