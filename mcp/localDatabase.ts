import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

type SqlParameters = Record<string, string | number | null>;

export interface SchoiceStatement {
  get(...parameters: unknown[]): unknown;
  all(...parameters: unknown[]): unknown[];
}

export interface SchoiceDatabase {
  prepare(sql: string): SchoiceStatement;
  close(): void;
}

const sqliteModuleName: string = process.versions.bun
  ? "bun:sqlite"
  : "better-sqlite3";
const sqliteModule = await import(sqliteModuleName);

function bunParameters(parameters: unknown[]): unknown[] {
  if (
    parameters.length !== 1 ||
    parameters[0] === null ||
    Array.isArray(parameters[0]) ||
    typeof parameters[0] !== "object"
  ) {
    return parameters;
  }
  const values = parameters[0] as SqlParameters;
  return [
    Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key.replace(/^[\$@:]/, ""),
        value,
      ]),
    ),
  ];
}

export function resolveSchoiceDatabasePath(): string {
  const configured = process.env.SCHOICE_DATABASE_PATH?.trim();
  if (configured) return resolve(configured);

  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Application Support", "schoice", "schoice.db");
  }
  if (process.platform === "win32") {
    const appData = process.env.APPDATA;
    if (!appData) throw new Error("APPDATA is unavailable; set SCHOICE_DATABASE_PATH.");
    return join(appData, "schoice", "schoice.db");
  }
  const dataHome = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share");
  return join(dataHome, "schoice", "schoice.db");
}

export function openSchoiceDatabase(
  databasePath = resolveSchoiceDatabasePath(),
): SchoiceDatabase {
  if (!existsSync(databasePath)) {
    throw new Error(
      `Schoice database was not found at ${databasePath}. Set SCHOICE_DATABASE_PATH if the app uses another location.`,
    );
  }
  if (process.versions.bun) {
    const BunDatabase = sqliteModule.Database as new (
      path: string,
      options: { readonly: boolean; strict: boolean },
    ) => {
      query(sql: string): {
        get(...parameters: unknown[]): unknown;
        all(...parameters: unknown[]): unknown[];
      };
      run(sql: string): unknown;
      close(): void;
    };
    const database = new BunDatabase(databasePath, {
      readonly: true,
      strict: true,
    });
    database.run("PRAGMA query_only = ON");
    database.run("PRAGMA busy_timeout = 5000");
    return {
      prepare(sql) {
        const statement = database.query(sql);
        return {
          get: (...parameters) => statement.get(...bunParameters(parameters)),
          all: (...parameters) => statement.all(...bunParameters(parameters)),
        };
      },
      close: () => database.close(),
    };
  }

  const NodeDatabase = sqliteModule.default as new (
    path: string,
    options: {
      readonly: boolean;
      fileMustExist: boolean;
      timeout: number;
    },
  ) => {
    prepare(sql: string): SchoiceStatement;
    pragma(sql: string): unknown;
    close(): void;
  };
  const database = new NodeDatabase(databasePath, {
    readonly: true,
    fileMustExist: true,
    timeout: 5_000,
  });
  database.pragma("query_only = ON");
  database.pragma("busy_timeout = 5000");
  return database;
}
