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
        Migration {
            version: 3,
            description: "add_obv_ma_and_mfi_columns_to_skills_tables",
            sql: "
                ALTER TABLE daily_skills
                    DROP COLUMN obv5;
                ALTER TABLE weekly_skills
                    DROP COLUMN obv5;
                ALTER TABLE hourly_skills
                    DROP COLUMN obv5;

                ALTER TABLE daily_skills
                    ADD COLUMN obv_ma5 REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN obv_ma10 REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN obv_ma20 REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN obv_ma60 REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN obv_ema5 REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN obv_ema10 REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN obv_ema20 REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN obv_ema60 REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN mfi REAL;

                ALTER TABLE weekly_skills
                    ADD COLUMN obv_ma5 REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN obv_ma10 REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN obv_ma20 REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN obv_ma60 REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN obv_ema5 REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN obv_ema10 REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN obv_ema20 REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN obv_ema60 REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN mfi REAL;

                ALTER TABLE hourly_skills
                    ADD COLUMN obv_ma5 REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN obv_ma10 REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN obv_ma20 REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN obv_ma60 REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN obv_ema5 REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN obv_ema10 REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN obv_ema20 REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN obv_ema60 REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN mfi REAL;
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add_ichimoku",
            sql: "
                ALTER TABLE daily_skills
                    ADD COLUMN tenkan REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN kijun REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN senkouA REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN senkouB REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN chikou REAL;

                ALTER TABLE weekly_skills
                    ADD COLUMN tenkan REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN kijun REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN senkouA REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN senkouB REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN chikou REAL;

                ALTER TABLE hourly_skills
                    ADD COLUMN tenkan REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN kijun REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN senkouA REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN senkouB REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN chikou REAL;
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "add_dmi",
            sql: "
                ALTER TABLE daily_skills
                    ADD COLUMN di_plus REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN di_minus REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN adx REAL;

                ALTER TABLE weekly_skills
                    ADD COLUMN di_plus REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN di_minus REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN adx REAL;

                ALTER TABLE hourly_skills
                    ADD COLUMN di_plus REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN di_minus REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN adx REAL;
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "change_hourly_ts_to_text",
            sql: "
                -- Handle hourly_deal
                CREATE TABLE hourly_deal_new (
                    stock_id TEXT,
                    ts TEXT,
                    c REAL,
                    o REAL,
                    h REAL,
                    l REAL,
                    v INTEGER,
                    PRIMARY KEY (stock_id, ts)
                );
                INSERT INTO hourly_deal_new SELECT stock_id, CAST(ts AS TEXT), c, o, h, l, v FROM hourly_deal;
                DROP TABLE hourly_deal;
                ALTER TABLE hourly_deal_new RENAME TO hourly_deal;

                -- Handle hourly_skills
                CREATE TABLE hourly_skills_new (
                    stock_id TEXT,
                    ts TEXT,
                    ma5 REAL,
                    ma5_ded REAL,
                    ma10 REAL,
                    ma10_ded REAL,
                    ma20 REAL,
                    ma20_ded REAL,
                    ma60 REAL,
                    ma60_ded REAL,
                    ma120 REAL,
                    ma120_ded REAL,
                    ema5 REAL,
                    ema10 REAL,
                    ema20 REAL,
                    ema60 REAL,
                    ema120 REAL,
                    macd REAL,
                    dif REAL,
                    osc REAL,
                    k REAL,
                    d REAL,
                    j REAL,
                    rsi5 REAL,
                    rsi10 REAL,
                    bollUb REAL,
                    bollMa REAL,
                    bollLb REAL,
                    obv REAL,
                    obv_ma5 REAL,
                    obv_ma10 REAL,
                    obv_ma20 REAL,
                    obv_ma60 REAL,
                    obv_ema5 REAL,
                    obv_ema10 REAL,
                    obv_ema20 REAL,
                    obv_ema60 REAL,
                    mfi REAL,
                    tenkan REAL,
                    kijun REAL,
                    senkouA REAL,
                    senkouB REAL,
                    chikou REAL,
                    di_plus REAL,
                    di_minus REAL,
                    adx REAL,
                    PRIMARY KEY (stock_id, ts)
                );
                INSERT INTO hourly_skills_new SELECT * FROM hourly_skills;
                DROP TABLE hourly_skills;
                ALTER TABLE hourly_skills_new RENAME TO hourly_skills;
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "add_cmf_column_to_skills_tables",
            sql: "
                ALTER TABLE daily_skills
                    ADD COLUMN cmf REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN cmf REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN cmf REAL;
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "add_cmf_ema5_column_to_skills_tables",
            sql: "
                ALTER TABLE daily_skills
                    ADD COLUMN cmf_ema5 REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN cmf_ema5 REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN cmf_ema5 REAL;
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 9,
            description: "add_issued_shares_to_stock_table",
            sql: "
                ALTER TABLE stock
                    ADD COLUMN issued_shares INTEGER;
                ALTER TABLE daily_skills
                    ADD COLUMN turnover_rate REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN turnover_rate REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN turnover_rate REAL;
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 10,
            description: "add_ma240_and_ma50_to_skills_tables",
            sql: "
                ALTER TABLE daily_skills
                    ADD COLUMN ma240 REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN ma240_ded REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN ma50 REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN ma50_ded REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN ma240 REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN ma240_ded REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN ma50 REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN ma50_ded REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN ma240 REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN ma240_ded REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN ma50 REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN ma50_ded REAL;
            ",
            kind: MigrationKind::Up,
        },   
        Migration {
            version: 11,
            description: "add_ma30_to_skills_tables",
            sql: "
                ALTER TABLE daily_skills
                    ADD COLUMN ma30 REAL;
                ALTER TABLE daily_skills
                    ADD COLUMN ma30_ded REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN ma30 REAL;
                ALTER TABLE weekly_skills
                    ADD COLUMN ma30_ded REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN ma30 REAL;
                ALTER TABLE hourly_skills
                    ADD COLUMN ma30_ded REAL;
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 12,
            description: "add_fundamental_and_investor_tables",
            sql: "
                CREATE TABLE financial_metric (
                  stock_id TEXT PRIMARY KEY,
                  pe REAL,
                  pb REAL,
                  dividend_yield REAL,
                  report_period TEXT,
                  gross_profit_margin REAL,
                  operating_margin REAL,
                  pre_tax_profit_margin REAL,
                  roa REAL,
                  roe REAL,
                  book_value_per_share REAL,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  CONSTRAINT fk_stock_financial FOREIGN KEY (stock_id) REFERENCES stock(stock_id) ON DELETE CASCADE
                );

                CREATE TABLE recent_fundamental (
                  stock_id TEXT PRIMARY KEY,
                  revenue_recent_m1_mom REAL,
                  revenue_recent_m1_yoy REAL,
                  revenue_recent_m1_yoy_acc REAL,
                  revenue_recent_m1_name TEXT,
                  revenue_recent_m2_mom REAL,
                  revenue_recent_m2_yoy REAL,
                  revenue_recent_m2_yoy_acc REAL,
                  revenue_recent_m2_name TEXT,
                  revenue_recent_m3_mom REAL,
                  revenue_recent_m3_yoy REAL,
                  revenue_recent_m3_yoy_acc REAL,
                  revenue_recent_m3_name TEXT,
                  revenue_recent_m4_mom REAL,
                  revenue_recent_m4_yoy REAL,
                  revenue_recent_m4_yoy_acc REAL,
                  revenue_recent_m4_name TEXT,
                  eps_recent_q1 REAL,
                  eps_recent_q1_name TEXT,
                  eps_recent_q2 REAL,
                  eps_recent_q2_name TEXT,
                  eps_recent_q3 REAL,
                  eps_recent_q3_name TEXT,
                  eps_recent_q4 REAL,
                  eps_recent_q4_name TEXT,
                  eps_recent_y1 REAL,
                  eps_recent_y1_name TEXT,
                  eps_recent_y2 REAL,
                  eps_recent_y2_name TEXT,
                  eps_recent_y3 REAL,
                  eps_recent_y3_name TEXT,
                  eps_recent_y4 REAL,
                  eps_recent_y4_name TEXT,
                  CONSTRAINT fk_stock_fundamental FOREIGN KEY (stock_id) REFERENCES stock(stock_id) ON DELETE CASCADE
                );

                CREATE TABLE investor_positions (
                  stock_id TEXT PRIMARY KEY,
                  recent_w1_foreign_ratio REAL,
                  recent_w1_big_investor_ratio REAL,
                  recent_w1_name TEXT,
                  recent_w2_foreign_ratio REAL,
                  recent_w2_big_investor_ratio REAL,
                  recent_w2_name TEXT,
                  recent_w3_foreign_ratio REAL,
                  recent_w3_big_investor_ratio REAL,
                  recent_w3_name TEXT,
                  recent_w4_foreign_ratio REAL,
                  recent_w4_big_investor_ratio REAL,
                  recent_w4_name TEXT,
                  CONSTRAINT fk_stock_investor FOREIGN KEY (stock_id) REFERENCES stock(stock_id) ON DELETE CASCADE
                );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 13,
            description: "add_stock_health_view",
            sql: "
                CREATE VIEW IF NOT EXISTS stock_health_view AS
                SELECT 
                    s.stock_id,
                    (SELECT MAX(t) FROM daily_deal d WHERE d.stock_id = s.stock_id) as daily_last_date,
                    (SELECT COUNT(*) FROM daily_deal d WHERE d.stock_id = s.stock_id) as daily_record_count,
                    (SELECT MAX(t) FROM weekly_deal w WHERE w.stock_id = s.stock_id) as weekly_last_date,
                    (SELECT MAX(ts) FROM hourly_deal h WHERE h.stock_id = s.stock_id) as hourly_last_date,
                    (f.pe IS NOT NULL AND f.pe != '') as has_financials,
                    (r.eps_recent_q1_name IS NOT NULL AND r.eps_recent_q1_name != '') as has_fundamentals,
                    (p.recent_w1_name IS NOT NULL AND p.recent_w1_name != '') as has_positions
                FROM stock s
                LEFT JOIN financial_metric f ON s.stock_id = f.stock_id
                LEFT JOIN recent_fundamental r ON s.stock_id = r.stock_id
                LEFT JOIN investor_positions p ON s.stock_id = p.stock_id;
            ",
            kind: MigrationKind::Up,
        },
    ]
}
