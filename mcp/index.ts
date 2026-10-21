import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createSchoiceMcpServer } from "./server";

void serveStdio(() => createSchoiceMcpServer());
console.error("Schoice MCP server running on stdio");
