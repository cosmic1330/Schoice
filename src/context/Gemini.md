# src/context

This directory contains React Context providers for managing global state in the application.

## Contexts

- **DatabaseContext.tsx**: This file defines the `DatabaseContext`, which provides access to the SQLite database instance (`db`) and an array of dates (`dates`). This allows other components to easily access the database without needing to pass the `db` object down through multiple levels of the component tree.

- **DealsContext.tsx**: This context provides an array of `TaType` objects, which represent technical analysis data for stock deals. This is likely used to share deal data between different components.

- **UserContext.tsx**: This file defines the `UserContext` and a `UserProvider` component. The `UserProvider` is responsible for fetching the current user's profile from Supabase and determining if they have a paid plan (`isPaid`). It also listens for authentication state changes and updates the `isPaid` state accordingly. The `useUser` hook provides a simple way for components to access the `isPaid` value.
