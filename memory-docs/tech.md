#  2. Tech Stack
-   **Frontend Framework**: React 19 + TypeScript
-   **Build Tool**: Vite 7
-   **Desktop Host**: Tauri v2
-   **State Management**:
    -   **Global UI State**: Zustand (`src/store`)
    -   **Dependency Injection**: React Context (`src/context`) for Database and User sessions.
    -   **Data Fetching**: SWR (stale-while-revalidate), implicit usage via hooks.
-   **Routing**: React Router v7 (`src/App.tsx`, `src/pages/Schoice/index.tsx`)
-   **Styling**:
    -   **Library**: Material UI (MUI) v6+
    -   **Methodology**: `styled` components for layout, `sx` prop for adjustments, `App.css` for global resets.
    -   **Icons**: `@mui/icons-material`
-   **Database**:
    -   **Local**: SQLite via `@tauri-apps/plugin-sql` (managed by `SqliteDataManager`)
    -   **Remote/Auth**: Supabase Client
-   **Utilities**: Lodash, Nanoid, `date-fns` (or custom date utils in `src/utils`)
-   **I18n**: i18next + react-i18next
-   **HTTP**: @tauri-apps/plugin-http
-   **Logging**: @tauri-apps/plugin-log
-   **Chart**: recharts
-   **Store**: @tauri-apps/plugin-store




## 3. Coding Style & Conventions
-   **Naming**:
    -   **Components**: PascalCase (e.g., `PromptList.tsx`).
    -   **Functions/Variables**: camelCase.
    -   **Files**: PascalCase for components, camelCase for logical files (hooks, utils).
    -   **Constants**: UPPER_CASE for global constants.
-   **TypeScript**:
    -   **Strict Mode**: Enabled. Avoid `any` where possible.
    -   **Interfaces/Types**: Define shared types in `src/types.ts` or co-located if specific to a component.
-   **Imports**:
    -   Order: External libraries -> Absolute/Alias imports -> Relative imports -> CSS.
-   **Components**:
    -   **Components**: Functional Components.
    -   Prefer named exports for consistency or default exports for pages/lazy-loaded components.
    -   Keep components small and focused. Extract logic to custom hooks.
    -   Extract duplicated methods into utils

## 4. Architectural Patterns

-   **Database Access**:
    -   DO NOT query the DB directly in UI components.
    -   Use `useDatabase` to get the DB instance.
    -   Use `SqliteDataManager` (or similar classes) to encapsulate SQL queries.
-   **State Management**:
    -   Use **Zustand** for shared UI state (e.g., theme, sidebar status).
    -   Use **React Context** only for static/slow-moving dependencies (User, DB connection).
-   **Styling**:
    -   Use `Stack`, `Box`, `Grid` from MUI for layout instead of raw `div`s with CSS classes.
    -   Use the `sx` prop for simple style overrides.
-   **Async Handling**:
    -   Use `async/await` for clean code.
    -   Handle loading (`isLoading`) and error states explicitly in components.
    -   Use `react-toastify` for user notifications (success/error).

## 5. Development Workflow

1.  **Modify**: Make changes in `src/`.
2.  **Lint/Type Check**: Ensure no TypeScript errors (`tsc` check implicit in build).
3.  **Run**: `pnpm tauri dev` or `npm run tauri dev` (based on user preference, `package.json` has `tauri` script).

## 6. Tauri Specifics

-   Use `@tauri-apps/plugin-log` for logging instead of `console.log` for crucial backend events.
-   Handle the asynchronous nature of Tauri APIs (e.g., `invoke`, `db.execute`).