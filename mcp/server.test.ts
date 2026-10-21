import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import Database from "better-sqlite3";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

function createFixtureDatabase(path: string): void {
  const database = new Database(path);
  database.exec(`
    CREATE TABLE stock (
      stock_id TEXT PRIMARY KEY,
      stock_name TEXT NOT NULL,
      industry_group TEXT NOT NULL,
      market_type TEXT NOT NULL,
      issued_shares REAL
    );
    CREATE TABLE daily_deal (
      stock_id TEXT NOT NULL,
      t TEXT NOT NULL,
      o REAL,
      h REAL,
      l REAL,
      c REAL,
      v REAL
    );
    CREATE TABLE daily_skills (
      stock_id TEXT NOT NULL,
      t TEXT NOT NULL,
      ma5 REAL, ma20 REAL, ma60 REAL, macd REAL, osc REAL,
      k REAL, d REAL, rsi5 REAL, rsi10 REAL
    );
    CREATE TABLE weekly_deal (
      stock_id TEXT NOT NULL,
      t TEXT NOT NULL,
      o REAL,
      h REAL,
      l REAL,
      c REAL,
      v REAL
    );
    CREATE TABLE weekly_skills (
      stock_id TEXT NOT NULL,
      t TEXT NOT NULL,
      ma5 REAL, ma20 REAL, ma60 REAL, macd REAL, osc REAL,
      k REAL, d REAL, rsi5 REAL, rsi10 REAL
    );
    CREATE TABLE hourly_deal (
      stock_id TEXT NOT NULL,
      ts TEXT NOT NULL,
      o REAL,
      h REAL,
      l REAL,
      c REAL,
      v REAL
    );
    CREATE TABLE hourly_skills (
      stock_id TEXT NOT NULL,
      ts TEXT NOT NULL,
      ma5 REAL, ma20 REAL, ma60 REAL, macd REAL, osc REAL,
      k REAL, d REAL, rsi5 REAL, rsi10 REAL
    );
    CREATE TABLE financial_metric (
      stock_id TEXT PRIMARY KEY,
      pe REAL
    );
    CREATE TABLE recent_fundamental (stock_id TEXT PRIMARY KEY);
    CREATE TABLE investor_positions (stock_id TEXT PRIMARY KEY);
    CREATE TABLE stock_health_view (
      stock_id TEXT PRIMARY KEY,
      daily_last_date TEXT,
      daily_record_count INTEGER,
      weekly_last_date TEXT,
      hourly_last_date TEXT,
      has_financials INTEGER,
      has_fundamentals INTEGER,
      has_revenue INTEGER,
      revenue_last_month TEXT,
      has_positions INTEGER
    );

    INSERT INTO stock VALUES
      ('2330', '台積電', '半導體業', '上市', 25930380500),
      ('2454', '聯發科', '半導體業', '上市', 1592900000),
      ('9999', '範例股', '其他業', '上櫃', 100000000);

    INSERT INTO daily_deal VALUES
      ('2330', '20261020', 590, 605, 585, 600, 1000),
      ('2330', '20261019', 580, 595, 575, 590, 900),
      ('2454', '20261020', 1190, 1210, 1180, 1200, 800),
      ('2454', '20261019', 1170, 1200, 1160, 1180, 700),
      ('9999', '20261020', 31, 32, 29, 30, 100),
      ('9999', '20261019', 30, 32, 29, 31, 120);
    INSERT INTO daily_skills (stock_id, t, rsi5) VALUES
      ('2330', '20261020', 25),
      ('2330', '20261019', 28),
      ('2454', '20261020', 35),
      ('2454', '20261019', 32),
      ('9999', '20261020', 20),
      ('9999', '20261019', 22);

    INSERT INTO weekly_deal VALUES
      ('2330', '20261020', 580, 610, 570, 600, 5000),
      ('2454', '20261020', 1160, 1220, 1150, 1200, 4000),
      ('9999', '20261020', 30, 32, 29, 30, 600);
    INSERT INTO weekly_skills (stock_id, t, ma5) VALUES
      ('2330', '20261020', 570),
      ('2454', '20261020', 1150),
      ('9999', '20261020', 31);

    INSERT INTO hourly_deal VALUES
      ('2330', '202610201300', 595, 602, 593, 600, 100),
      ('2454', '202610201300', 1185, 1205, 1180, 1200, 80),
      ('9999', '202610201300', 31, 31, 29, 30, 10);
    INSERT INTO hourly_skills (stock_id, ts, macd) VALUES
      ('2330', '202610201300', 2),
      ('2454', '202610201300', 1),
      ('9999', '202610201300', -1);

    INSERT INTO financial_metric VALUES
      ('2330', 20),
      ('2454', 15),
      ('9999', 50);
    INSERT INTO recent_fundamental VALUES ('2330'), ('2454'), ('9999');
    INSERT INTO investor_positions VALUES ('2330'), ('2454'), ('9999');
    INSERT INTO stock_health_view VALUES
      ('2330', '20261020', 2, '20261020', '202610201300', 1, 1, 1, '2026-09', 1),
      ('2454', '20261020', 2, '20261020', '202610201300', 1, 1, 1, '2026-09', 1),
      ('9999', '20261020', 2, '20261020', '202610201300', 1, 1, 1, '2026-09', 1);
  `);
  database.close();
}

function textResult(result: Awaited<ReturnType<Client["callTool"]>>): unknown {
  const item = result.content.find((content) => content.type === "text");
  assert.ok(item && item.type === "text");
  return JSON.parse(item.text);
}

test("MCP server exposes local search, detail, history, and screening", async () => {
  const fixtureDirectory = mkdtempSync(join(tmpdir(), "schoice-mcp-test-"));
  const fixturePath = join(fixtureDirectory, "schoice.db");
  createFixtureDatabase(fixturePath);

  const client = new Client({ name: "schoice-test", version: "0.1.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", "tsx", "mcp/index.ts"],
    cwd: projectRoot,
    env: {
      PATH: process.env.PATH ?? "",
      SCHOICE_DATABASE_PATH: fixturePath,
    },
    stderr: "pipe",
  });

  try {
    await client.connect(transport);
    const listed = await client.listTools();
    assert.deepEqual(
      listed.tools.map((tool) => tool.name).sort(),
      [
        "create_strategy",
        "get_stock_detail",
        "get_stock_history",
        "get_strategy_capabilities",
        "list_strategies",
        "screen_stocks",
        "search_stocks",
        "validate_strategy",
      ],
    );

    const capabilities = await client.callTool({
      name: "get_strategy_capabilities",
      arguments: { timeframe: "daily" },
    });
    assert.equal(capabilities.isError, undefined);
    assert.match(JSON.stringify(capabilities.content), /rsi5/);

    const unauthenticatedCreate = await client.callTool({
      name: "create_strategy",
      arguments: {
        type: "bull",
        strategy: {
          name: "AI 建立策略",
          conditions: {
            daily: [
              {
                day1: "今天",
                indicator1: "rsi5",
                operator: "小於",
                day2: "自定義數值",
                indicator2: "30",
              },
            ],
            weekly: [],
            hourly: [],
          },
        },
      },
    });
    assert.equal(unauthenticatedCreate.isError, true);
    assert.match(
      JSON.stringify(unauthenticatedCreate.content),
      /Missing configuration/,
    );

    const search = await client.callTool({
      name: "search_stocks",
      arguments: { query: "台積電" },
    });
    assert.equal(search.isError, undefined);
    const searchResult = textResult(search) as {
      count: number;
      stocks: Array<{ stockId: string }>;
    };
    assert.equal(searchResult.count, 1);
    assert.equal(searchResult.stocks[0]?.stockId, "2330");

    const history = await client.callTool({
      name: "get_stock_history",
      arguments: {
        stock_id: "2330",
        timeframe: "daily",
        indicators: ["rsi5"],
        as_of: "20261020",
        limit: 2,
      },
    });
    assert.equal(history.isError, undefined, JSON.stringify(history.content));
    const historyResult = textResult(history) as {
      summary: { closeChange: number; lastTime: string };
      points: Array<{ time: string; indicators: { rsi5: number } }>;
    };
    assert.equal(historyResult.summary.closeChange, 10);
    assert.equal(historyResult.summary.lastTime, "20261020");
    assert.deepEqual(
      historyResult.points.map((point) => point.time),
      ["20261019", "20261020"],
    );
    assert.equal(historyResult.points[1]?.indicators.rsi5, 25);

    const invalidHistory = await client.callTool({
      name: "get_stock_history",
      arguments: {
        stock_id: "2330",
        timeframe: "daily",
        indicators: ["not_an_indicator"],
      },
    });
    assert.equal(invalidHistory.isError, true);
    assert.match(
      JSON.stringify(invalidHistory.content),
      /Unsupported daily indicators/,
    );

    const detail = await client.callTool({
      name: "get_stock_detail",
      arguments: { stock_id: "2330" },
    });
    assert.equal(detail.isError, undefined, JSON.stringify(detail.content));
    const detailResult = textResult(detail) as {
      stock: { stockName: string };
      technical: { daily: { dataDate: string } };
      fundamentals: { financialMetrics: { pe: number } };
      coverage: { dailyRecordCount: number };
    };
    assert.equal(detailResult.stock.stockName, "台積電");
    assert.equal(detailResult.technical.daily.dataDate, "20261020");
    assert.equal(detailResult.fundamentals.financialMetrics.pe, 20);
    assert.equal(detailResult.coverage.dailyRecordCount, 2);

    const literalWildcardSearch = await client.callTool({
      name: "search_stocks",
      arguments: { query: "%" },
    });
    assert.equal(literalWildcardSearch.isError, undefined);
    assert.equal(
      (textResult(literalWildcardSearch) as { count: number }).count,
      0,
    );

    const screen = await client.callTool({
      name: "screen_stocks",
      arguments: {
        strategy: {
          name: "多週期超賣反彈",
          conditions: {
            daily: [
              {
                day1: "今天",
                indicator1: "rsi5",
                operator: "小於",
                day2: "自定義數值",
                indicator2: "30",
              },
              {
                day1: "今天",
                indicator1: "收盤價",
                operator: "大於",
                day2: "昨天",
                indicator2: "收盤價",
              },
            ],
            weekly: [
              {
                day1: "本週",
                indicator1: "收盤價",
                operator: "大於",
                day2: "本週",
                indicator2: "ma5",
              },
            ],
            hourly: [
              {
                day1: "現在",
                indicator1: "macd",
                operator: "大於",
                day2: "自定義數值",
                indicator2: "0",
              },
            ],
          },
        },
        fundamental_conditions: [
          {
            indicator: "本益比",
            operator: "小於",
            value: 30,
          },
        ],
        as_of: "20261020",
      },
    });
    assert.equal(screen.isError, undefined, JSON.stringify(screen.content));
    const screenResult = textResult(screen) as {
      total: number;
      matches: Array<{ stockId: string; matchedConditions: unknown[] }>;
    };
    assert.equal(screenResult.total, 1);
    assert.equal(screenResult.matches[0]?.stockId, "2330");
    assert.equal(screenResult.matches[0]?.matchedConditions.length, 5);

    const unauthenticatedList = await client.callTool({
      name: "list_strategies",
      arguments: {},
    });
    assert.equal(unauthenticatedList.isError, true);
    assert.match(JSON.stringify(unauthenticatedList.content), /Missing configuration/);

    const validation = await client.callTool({
      name: "validate_strategy",
      arguments: {
        strategy: {
          name: "RSI 超賣",
          conditions: {
            daily: [
              {
                day1: "今天",
                indicator1: "rsi5",
                operator: "小於",
                day2: "自定義數值",
                indicator2: "30",
              },
            ],
            weekly: [],
            hourly: [],
          },
        },
      },
    });
    assert.equal(validation.isError, undefined);
    const validationResult = textResult(validation) as { valid: boolean };
    assert.equal(validationResult.valid, true);
  } finally {
    await client.close();
    rmSync(fixtureDirectory, { recursive: true, force: true });
  }
});
