CREATE TABLE financial_metric (
  stock_id TEXT PRIMARY KEY,               -- 股票代號，主鍵
  pe FLOAT,                                -- 本益比
  pb FLOAT,                                -- 股價淨值比
  dividend_yield FLOAT,                    -- 殖利率
  report_period TEXT,                      -- 財報年/季
  gross_profit_margin FLOAT,               -- 營業毛利率
  operating_margin FLOAT,                  -- 營業利益率
  pre_tax_profit_margin FLOAT,             -- 稅前淨利率
  roa FLOAT,                               -- 資產報酬率
  roe FLOAT,                               -- 股東權益報酬率
  book_value_per_share FLOAT,              -- 每股淨值
  updated_at TIMESTAMP DEFAULT NOW()       -- 更新時間
);

CREATE TABLE fundamental_condition (
  user_id uuid PRIMARY KEY references auth.users(id),
  conditions text
);

CREATE TABLE watch_stock (
  user_id uuid REFERENCES auth.users(id),
  stock_id TEXT REFERENCES stock(stock_id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, stock_id),  -- 複合主鍵

  CONSTRAINT fk_stock 
    FOREIGN KEY (stock_id) 
    REFERENCES stock(stock_id)
    ON DELETE CASCADE
);

CREATE TABLE recent_fundamental (
  stock_id TEXT PRIMARY KEY,  -- 股票代碼（文字，因有些代碼有字母）

  -- 最近四季 EPS
  eps_recent_q1 FLOAT,         -- 最近一季 EPS
  eps_recent_q1_name TEXT,     -- 最近一季名稱，例如 '2025Q2'
  eps_recent_q2 FLOAT,         -- 往前第二季 EPS
  eps_recent_q2_name TEXT,     -- 往前第二季名稱
  eps_recent_q3 FLOAT,         -- 往前第三季 EPS
  eps_recent_q3_name TEXT,     -- 往前第三季名稱
  eps_recent_q4 FLOAT,         -- 往前第四季 EPS
  eps_recent_q4_name TEXT,     -- 往前第四季名稱

  -- 最近四年 EPS
  eps_recent_y1 FLOAT,         -- 最近一年 EPS
  eps_recent_y1_name TEXT,     -- 最近一年名稱，例如 '2024'
  eps_recent_y2 FLOAT,         -- 往前第二年 EPS
  eps_recent_y2_name TEXT,     -- 往前第二年名稱
  eps_recent_y3 FLOAT,         -- 往前第三年 EPS
  eps_recent_y3_name TEXT,     -- 往前第三年名稱
  eps_recent_y4 FLOAT,         -- 往前第四年 EPS
  eps_recent_y4_name TEXT,     -- 往前第四年名稱

  CONSTRAINT fk_stock 
    FOREIGN KEY (stock_id) 
    REFERENCES stock(stock_id)
    ON DELETE CASCADE
);

create table stock (
  stock_id text primary key,       -- 股票代碼（文字，因有些代碼有字母）
  stock_name text not null,        -- 股票名稱
  industry_group text,             -- 所屬產業群組
  market_type text                 -- 市場別（上市、上櫃、興櫃…）
);

create table user_prompts (
  prompt_id serial primary key,
  user_id uuid references auth.users(id),
  prompt_type text,
  prompt_name text,
  conditions text,
  updated_at timestamp with time zone default now(),
  alarm boolean default false,
  trash boolean default false
);

create table profiles (
  user_id uuid primary key references auth.users(id),
  plan_tier text
);