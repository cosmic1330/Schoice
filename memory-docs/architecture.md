### Actual Project Structure

-   `src-tauri/`: Rust backend and Tauri configuration.
    -   `src-tauri/src/`: Rust source.
        -   `src-tauri/src/main.rs`: Main entry point.
        -   `src-tauri/src/sqlite/`: SQLite database and migrations.
        
-   `src/`: Frontend source.
    -   `assets/`: Static assets.
    -   `classes/`: Business logic classes and Data Access Objects (e.g., `SqliteDataManager.ts`). Avoid putting UI logic here.
    -   `cls_tools/`: exports instances of technical analysis indicator classes from the `@ch20026103/anysis` library. 
    -   `components/`: Reusable, generic UI components.
    -   `context/`: React Context providers (User, Database).
    -   `database/`:  postgres connection and getDbInstance.
    -   `hooks/`: Custom React hooks (logic encapsulation).
    -   `pages/`: Feature-specific page components. Sub-directories (e.g., `Schoice`) can contain their own route components.
    -   `store/`: Zustand stores & @tauri-apps/plugin-store.
    -   `tools/`: like Error handle, http, i18n, supabase client.
    -   `utils/`: Any helper functions
    -   `types.ts`: Shared TypeScript definitions and interfaces for all components in project.

-  `cloud_schema.sql`: Postgres schema for cloud database.