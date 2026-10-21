import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function hostTargetTriple() {
  const result = spawnSync("rustc", ["-vV"], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || "Unable to determine the Rust target triple.");
  }
  const host = result.stdout.match(/^host: (.+)$/m)?.[1];
  if (!host) throw new Error("rustc did not report a host target triple.");
  return host;
}

const targetTriple =
  process.env.TAURI_ENV_TARGET_TRIPLE ||
  process.env.CARGO_BUILD_TARGET ||
  hostTargetTriple();

const bunTargets = {
  "aarch64-apple-darwin": "bun-darwin-arm64",
  "x86_64-apple-darwin": "bun-darwin-x64",
  "aarch64-unknown-linux-gnu": "bun-linux-arm64",
  "x86_64-unknown-linux-gnu": "bun-linux-x64",
  "aarch64-pc-windows-msvc": "bun-windows-arm64",
  "x86_64-pc-windows-msvc": "bun-windows-x64",
};

const bunTarget = bunTargets[targetTriple];
if (!bunTarget) {
  throw new Error(`Unsupported MCP sidecar target: ${targetTriple}`);
}

const executableSuffix = targetTriple.includes("windows") ? ".exe" : "";
const output = resolve(
  root,
  "src-tauri",
  "binaries",
  `schoice-mcp-${targetTriple}${executableSuffix}`,
);
mkdirSync(dirname(output), { recursive: true });

const result = spawnSync(
  process.platform === "win32" ? "bun.exe" : "bun",
  [
    "build",
    "--compile",
    `--target=${bunTarget}`,
    "--outfile",
    output,
    "mcp/http.ts",
  ],
  { cwd: root, stdio: "inherit" },
);

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

