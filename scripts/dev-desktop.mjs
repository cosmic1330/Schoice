import { spawn, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sidecar = spawnSync(process.execPath, ["scripts/build-mcp-sidecar.mjs"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
if (sidecar.error) throw sidecar.error;
if (sidecar.status !== 0) process.exit(sidecar.status ?? 1);

const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const vite = spawn(pnpm, ["dev"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => vite.kill(signal));
}
vite.once("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});

