use tauri_plugin_sql::{Migration, MigrationKind};

pub fn value() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "
                CREATE TABLE stock (
                    id TEXT PRIMARY KEY, -- 股票代號
                    name TEXT, -- 股票名稱
                    industry_group TEXT, -- 產業別
                    market_type TEXT -- 上市/上櫃
                );
                CREATE TABLE daily_deal (
                    stock_id TEXT, -- 股票代號
                    t TEXT,  -- 日期
                    c REAL, -- 收盤價
                    o REAL, -- 開盤價
                    h REAL, -- 最高價
                    l REAL, -- 最低價
                    v INTEGER, -- 成交量
                    PRIMARY KEY (stock_id, t),
                    FOREIGN KEY (stock_id) REFERENCES stock(id)
                );
                CREATE TABLE skills (
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
                    PRIMARY KEY (stock_id, t),
                    FOREIGN KEY (stock_id) REFERENCES stock(id)
                );
                ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_week_tables",
            sql: "
                CREATE TABLE weekly_deal (
                    stock_id TEXT, -- 股票代號
                    t TEXT,  -- 日期
                    c REAL, -- 收盤價
                    o REAL, -- 開盤價
                    h REAL, -- 最高價
                    l REAL, -- 最低價
                    v INTEGER, -- 成交量
                    PRIMARY KEY (stock_id, t),
                    FOREIGN KEY (stock_id) REFERENCES stock(id)
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
                    PRIMARY KEY (stock_id, t),
                    FOREIGN KEY (stock_id) REFERENCES stock(id)
                );
                ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_hour_tables",
            sql: "
                ALTER TABLE skills RENAME TO daily_skills;
                CREATE TABLE hourly_deal (
                    stock_id TEXT, -- 股票代號
                    ts INTEGER,  -- 時間戳
                    c REAL, -- 收盤價
                    o REAL, -- 開盤價
                    h REAL, -- 最高價
                    l REAL, -- 最低價
                    v INTEGER, -- 成交量
                    PRIMARY KEY (stock_id, ts),
                    FOREIGN KEY (stock_id) REFERENCES stock(id)
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
                    PRIMARY KEY (stock_id, ts),
                    FOREIGN KEY (stock_id) REFERENCES stock(id)
                );
                ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add_j_column_to_daily_skills",
            sql: "
                ALTER TABLE daily_skills ADD COLUMN j REAL; -- J 指標
                ALTER TABLE hourly_skills ADD COLUMN j REAL; -- J 指標
                ALTER TABLE weekly_skills ADD COLUMN j REAL; -- J 指標
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "create_fundamental_table",
            sql: "
               CREATE TABLE fundamental (
                    stock_id TEXT, -- 股票代號
                    pe REAL, -- 本益比
                    pb REAL, -- 股價淨值比
                    dividend_yield REAL, -- 殖利率
                    yoy REAL, -- 當月營收年增率
                    eps REAL, -- 前四季eps
                    PRIMARY KEY (stock_id),
                    FOREIGN KEY (stock_id) REFERENCES stock(id)
                );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "add_avg_year_dividend_yield_column_to_fundamental",
            sql: "
                ALTER TABLE fundamental ADD COLUMN dividend_yield_3y REAL; -- 3年平均殖利率
                ALTER TABLE fundamental ADD COLUMN dividend_yield_5y REAL; -- 5年平均殖利率
            ",
            kind: MigrationKind::Up,
        },
    ]
}
