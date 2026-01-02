# 1. Project Context
- **Project Name:** Schoice
- **Description:** This project is a desktop application for stock selection. Users can define their own technical-indicator rules to search for stocks that match the criteria in the database.
The system supports both a local SQLite database and a cloud PostgreSQL database. It will query the cloud database first, and only fall back to the local database if the cloud connection is unavailable.
- **Goal:** Automatically generate SQL queries based on user-defined rules, execute them against the database, and display the results in the UI.