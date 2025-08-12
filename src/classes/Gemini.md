# src/classes

This directory contains the core data management and query building logic for the application.

## Data Managers

- **CsvDataManager.ts**: This class is responsible for generating CSV data for stock deals and technical analysis indicators. It takes raw technical analysis data (`TaType`) and transforms it into a CSV-friendly format.

- **SqliteDataManager.ts**: This class manages all interactions with the SQLite database. It handles clearing tables, deleting data, querying for the latest data, and processing and saving new data. It includes methods for handling daily, weekly, and hourly stock data, as well as fundamental data. It also contains the logic for calculating a wide range of technical indicators (MA, MACD, RSI, etc.) and saving them to the database.

## Query Builders

The query builder classes are used to construct SQL queries based on user-defined criteria. They provide a user-friendly way to filter and retrieve specific stock data.

- **StockDailyQueryBuilder.ts**: Builds SQL queries for daily stock data. It allows users to create conditions based on daily indicators like closing price, opening price, volume, and various moving averages.

- **StockWeeklyQueryBuilder.ts**: Similar to the daily query builder, but for weekly stock data.

- **StockHourlyQueryBuilder.ts**: Builds queries for hourly stock data.

- **StockFundamentalQueryBuilder.ts**: Constructs queries based on fundamental stock data, such as P/E ratio, dividend yield, and EPS.

Each query builder provides a set of predefined options for timeframes, indicators, and operators, making it easy to create complex queries from a simple user interface.
