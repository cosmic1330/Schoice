use tauri_plugin_sql::{Migration, MigrationKind};

pub fn value() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "
                CREATE TABLE daily_deal (
                    stock_id TEXT, -- 股票代號
                    t TEXT,  -- 日期
                    c REAL, -- 收盤價
                    o REAL, -- 開盤價
                    h REAL, -- 最高價
                    l REAL, -- 最低價
                    v INTEGER, -- 成交量
                    PRIMARY KEY (stock_id, t)
                );

                CREATE TABLE daily_skills (
                    stock_id TEXT, -- 股票代號
                    t TEXT,  -- 日期
                    ma5 REAL, -- 5日均線
                    ma5_ded REAL, -- 5日扣抵
                    ma10 REAL, -- 10日均線
                    ma10_ded REAL, -- 10日扣抵
                    ma20 REAL, -- 20日均線
                    ma20_ded REAL, -- 20日扣抵
                    ma60 REAL, -- 60日均線
                    ma60_ded REAL, -- 60日扣抵
                    ma120 REAL, -- 120日均線
                    ma120_ded REAL, -- 120日扣抵
                    macd REAL, -- MACD
                    dif REAL, -- DIF
                    osc REAL, -- OSC
                    k REAL, -- K
                    d REAL, -- D
                    rsi5 REAL, -- RSI5
                    rsi10 REAL, -- RSI10
                    bollUb REAL, -- Bollinger Upper Band
                    bollMa REAL, -- Bollinger Middle Band
                    bollLb REAL, -- Bollinger Lower Band
                    obv REAL, -- OBV
                    obv5 REAL, -- OBV5
                    j REAL, -- J 指標
                    PRIMARY KEY (stock_id, t)
                );

                CREATE TABLE weekly_deal (
                    stock_id TEXT, -- 股票代號
                    t TEXT,  -- 日期
                    c REAL, -- 收盤價
                    o REAL, -- 開盤價
                    h REAL, -- 最高價
                    l REAL, -- 最低價
                    v INTEGER, -- 成交量
                    PRIMARY KEY (stock_id, t)
                );

                CREATE TABLE weekly_skills (
                    stock_id TEXT, -- 股票代號
                    t TEXT,  -- 日期
                    ma5 REAL, -- 5日均線
                    ma5_ded REAL, -- 5日扣抵
                    ma10 REAL, -- 10日均線
                    ma10_ded REAL, -- 10日扣抵
                    ma20 REAL, -- 20日均線
                    ma20_ded REAL, -- 20日扣抵
                    ma60 REAL, -- 60日均線
                    ma60_ded REAL, -- 60日扣抵
                    ma120 REAL, -- 120日均線
                    ma120_ded REAL, -- 120日扣抵
                    macd REAL, -- MACD
                    dif REAL, -- DIF
                    osc REAL, -- OSC
                    k REAL, -- K
                    d REAL, -- D
                    rsi5 REAL, -- RSI5
                    rsi10 REAL, -- RSI10
                    bollUb REAL, -- Bollinger Upper Band
                    bollMa REAL, -- Bollinger Middle Band
                    bollLb REAL, -- Bollinger Lower Band
                    obv REAL, -- OBV
                    obv5 REAL, -- OBV5
                    j REAL, -- J 指標
                    PRIMARY KEY (stock_id, t)
                );

                CREATE TABLE hourly_deal (
                    stock_id TEXT, -- 股票代號
                    ts INTEGER,  -- 時間戳
                    c REAL, -- 收盤價
                    o REAL, -- 開盤價
                    h REAL, -- 最高價
                    l REAL, -- 最低價
                    v INTEGER, -- 成交量
                    PRIMARY KEY (stock_id, ts)
                );

                CREATE TABLE hourly_skills (
                    stock_id TEXT, -- 股票代號
                    ts INTEGER,  -- 時間戳
                    ma5 REAL, -- 5日均線
                    ma5_ded REAL, -- 5日扣抵
                    ma10 REAL, -- 10日均線
                    ma10_ded REAL, -- 10日扣抵
                    ma20 REAL, -- 20日均線
                    ma20_ded REAL, -- 20日扣抵
                    ma60 REAL, -- 60日均線
                    ma60_ded REAL, -- 60日扣抵
                    ma120 REAL, -- 120日均線
                    ma120_ded REAL, -- 120日扣抵
                    macd REAL, -- MACD
                    dif REAL, -- DIF
                    osc REAL, -- OSC
                    k REAL, -- K
                    d REAL, -- D
                    rsi5 REAL, -- RSI5
                    rsi10 REAL, -- RSI10
                    bollUb REAL, -- Bollinger Upper Band
                    bollMa REAL, -- Bollinger Middle Band
                    bollLb REAL, -- Bollinger Lower Band
                    obv REAL, -- OBV
                    obv5 REAL, -- OBV5
                    j REAL, -- J 指標
                    PRIMARY KEY (stock_id, ts)
                );

                CREATE TABLE stock (
                    stock_id TEXT PRIMARY KEY, -- 股票代號
                    stock_name TEXT, -- 股票名稱
                    industry_group TEXT, -- 產業別
                    market_type TEXT -- 上市/上櫃
                );
                ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_ema_columns_to_skills_tables",
            sql: "
                ALTER TABLE daily_skills
                    ADD COLUMN ema5 REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN ema10 REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN ema20 REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN ema60 REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN ema120 REAL;

                ALTER TABLE weekly_skills
                    ADD COLUMN ema5 REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN ema10 REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN ema20 REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN ema60 REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN ema120 REAL;

                ALTER TABLE hourly_skills
                    ADD COLUMN ema5 REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN ema10 REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN ema20 REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN ema60 REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN ema120 REAL;
            ",
            kind: MigrationKind::Up,
        },
    ]
}
