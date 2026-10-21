import { createInterface } from "node:readline";
import { randomUUID } from "node:crypto";
import {
  createMcpHandler,
  hostHeaderValidationResponse,
  originValidationResponse,
} from "@modelcontextprotocol/server";
import {
  createSchoiceMcpServer,
  type MutationApprovalRequest,
} from "./server";

const HOST = "127.0.0.1";
const DEFAULT_PORT = 37_621;
const APPROVAL_TIMEOUT_MS = 120_000;

interface BunServer {
  stop(closeActiveConnections?: boolean): void;
}

interface BunRuntime {
  serve(options: {
    hostname: string;
    port: number;
    fetch(request: Request): Response | Promise<Response>;
  }): BunServer;
}

interface ApprovalResponse {
  type: "approval_response";
  id: string;
  approved: boolean;
}

const bun = (globalThis as typeof globalThis & { Bun?: BunRuntime }).Bun;
if (!bun) {
  throw new Error("The local HTTP MCP sidecar must run with Bun.");
}

const portText = process.env.SCHOICE_MCP_PORT?.trim();
const port = portText ? Number(portText) : DEFAULT_PORT;
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("SCHOICE_MCP_PORT must be an integer from 1 through 65535.");
}

const pendingApprovals = new Map<
  string,
  (approved: boolean) => void
>();

createInterface({ input: process.stdin }).on("line", (line) => {
  try {
    const message = JSON.parse(line) as ApprovalResponse;
    if (
      message.type !== "approval_response" ||
      typeof message.id !== "string" ||
      typeof message.approved !== "boolean"
    ) {
      return;
    }
    pendingApprovals.get(message.id)?.(message.approved);
  } catch {
    console.error("Ignored an invalid control message from the desktop app.");
  }
});

async function requestApproval(
  request: MutationApprovalRequest,
): Promise<boolean> {
  const id = randomUUID();
  return new Promise((resolve) => {
    const finish = (approved: boolean) => {
      clearTimeout(timeout);
      pendingApprovals.delete(id);
      resolve(approved);
    };
    const timeout = setTimeout(() => finish(false), APPROVAL_TIMEOUT_MS);
    timeout.unref();
    pendingApprovals.set(id, finish);
    process.stdout.write(
      `${JSON.stringify({ type: "approval_request", id, ...request })}\n`,
    );
  });
}

const handler = createMcpHandler(
  () => createSchoiceMcpServer({ approveMutation: requestApproval }),
  {
    legacy: "stateless",
    responseMode: "json",
    maxRequestBodySize: 1024 * 1024,
    onerror: (error) => console.error("MCP request failed:", error),
  },
);

const server = bun.serve({
  hostname: HOST,
  port,
  async fetch(request) {
    const hostRejection = hostHeaderValidationResponse(request, [HOST]);
    if (hostRejection) return hostRejection;

    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      return Response.json({ status: "ok", endpoint: `http://${HOST}:${port}/mcp` });
    }
    if (url.pathname !== "/mcp") {
      return new Response("Not found", { status: 404 });
    }

    const originRejection = originValidationResponse(request, [HOST]);
    return originRejection ?? handler.fetch(request);
  },
});

process.stdout.write(
  `${JSON.stringify({ type: "ready", host: HOST, port, path: "/mcp" })}\n`,
);
console.error(`Schoice MCP listening on http://${HOST}:${port}/mcp`);

async function shutdown() {
  server.stop(true);
  await handler.close();
  process.exit(0);
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
