import assert from "node:assert/strict";
import { test } from "node:test";
import { clearMocks, mockIPC } from "@tauri-apps/api/mocks";
import type Database from "@tauri-apps/plugin-sql";
import SyncDatabaseHelper from "./SyncDatabaseHelper";
import type {
  DealTableType,
  SkillsTableType,
  TimeSharingDealTableType,
  TimeSharingSkillsTableType,
} from "../types";

test("daily and hourly writes submit every chunk in one transaction and propagate failures", async () => {
  Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
  const helper = new SyncDatabaseHelper({
    execute: () => { throw new Error("Writes must use the native transaction"); },
  } as unknown as Database);
  const rows = Array.from({ length: 201 }, (_, index) => ({
    stock_id: "2330", t: String(index), ts: String(index),
    o: 100, h: 110, l: 90, c: 105, v: 1000, ma5: 99,
  }));
  const cases = [
    { period: "daily", save: (empty = false) => helper.saveDailyBatch(
      (empty ? [] : rows) as DealTableType[], (empty ? [] : rows) as unknown as SkillsTableType[],
    ) },
    { period: "hourly", save: (empty = false) => helper.saveHourlyBatch(
      (empty ? [] : rows) as TimeSharingDealTableType[], (empty ? [] : rows) as unknown as TimeSharingSkillsTableType[],
    ) },
  ];
  try {
    for (const { period, save } of cases) {
      const calls: string[][] = [];
      mockIPC((command, payload) => {
        assert.equal(command, "execute_sql_transaction");
        calls.push((payload as { statements: string[] }).statements);
        return 402;
      });
      await save();
      assert.equal(calls.length, 1);
      assert.equal(calls[0].filter(sql => sql.startsWith(`INSERT OR REPLACE INTO ${period}_deal `)).length, 2);
      assert.equal(calls[0].filter(sql => sql.startsWith(`INSERT OR REPLACE INTO ${period}_skills `)).length, 5);
      await save(true);
      assert.equal(calls.length, 1, "empty batches must not invoke the backend");
      mockIPC(() => { throw new Error("indicator write failed"); });
      await assert.rejects(save(), /indicator write failed/);
      clearMocks();
    }
  } finally {
    clearMocks();
    Reflect.deleteProperty(globalThis, "window");
  }
});
