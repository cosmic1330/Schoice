import { readFileSync } from "node:fs";

export interface McpConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseAccessToken: string;
}

interface McpSessionFile {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseAccessToken?: string | null;
}

export class McpConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "McpConfigurationError";
  }
}

function readSessionFile(): McpSessionFile {
  const path = process.env.SCHOICE_SESSION_PATH?.trim();
  if (!path) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8")) as McpSessionFile;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw new McpConfigurationError(`Unable to read MCP session file: ${String(error)}`);
  }
}

function requiredValue(
  sessionValue: string | null | undefined,
  ...names: string[]
): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  if (sessionValue?.trim()) return sessionValue.trim();
  throw new McpConfigurationError(
    `Missing configuration. Set one of: ${names.join(", ")}, or sign in to the Schoice app.`,
  );
}

export function loadMcpConfig(): McpConfig {
  const session = readSessionFile();
  return {
    supabaseUrl: requiredValue(
      session.supabaseUrl,
      "SCHOICE_SUPABASE_URL",
      "VITE_SUPABASE_URL",
    ),
    supabaseAnonKey: requiredValue(
      session.supabaseAnonKey,
      "SCHOICE_SUPABASE_ANON_KEY",
      "VITE_SUPABASE_ANON_KEY",
    ),
    supabaseAccessToken: requiredValue(
      session.supabaseAccessToken,
      "SCHOICE_SUPABASE_ACCESS_TOKEN",
    ),
  };
}
