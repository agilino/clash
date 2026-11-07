// CLASH MCP server, the starter on CLASH's 19-start. One tool works already:
// list_upcoming_clashes. Task 19 adds find_venue (step 2), create_clash (step 3)
// and cancel_clash (step 4).
// The finished server is mcp/server.ts on CLASH's 19-solution.
// Start it with: npx tsx mcp/server.ts   (Claude Code does this via .mcp.json)
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// The database is <clash root>/dev.db. We find it from this file, not from
// process.cwd(), so another app can start the server from its own folder.
const clashRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbFile = path.join(clashRoot, "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbFile}` });
const prisma = new PrismaClient({ adapter });

// stdout is the protocol channel. Logs go to stderr only. Never console.log.
function log(message: string) {
  console.error(`[clash-mcp] ${message}`);
}

// Every tool answers with plain text. A refusal is text too, marked as an error.
function reply(message: string) {
  return { content: [{ type: "text" as const, text: message }] };
}
function refuse(message: string) {
  return { ...reply(message), isError: true };
}

// ISO 8601 date-time: 2099-12-31T19:00, optional seconds, fraction and offset.
// new Date() alone also accepts "12/31/2099" or a bare "2099-01-01",
// and rolls an impossible day such as "2099-02-29" over to March 1.
const isoDateTime = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/;
function isIsoDateTime(value: string) {
  const match = isoDateTime.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1, 4).map(Number);
  const calendarDay = new Date(Date.UTC(year, month - 1, day));
  return calendarDay.getUTCMonth() === month - 1 && calendarDay.getUTCDate() === day;
}

const server = new McpServer({ name: "clash", version: "1.0.0" });

// The model tool: a name, a description the model reads, a zod schema, a function.
server.registerTool(
  "list_upcoming_clashes",
  {
    description:
      "List upcoming clashes, earliest first, at most 20. " +
      "Optional area: only clashes whose title, description or venue name contains it.",
    inputSchema: z.object({ area: z.string().optional() }),
  },
  async ({ area }) => {
    const matchesArea = area
      ? {
          OR: [
            { title: { contains: area } },
            { description: { contains: area } },
            { venue: { title: { contains: area } } },
          ],
        }
      : {};
    const clashes = await prisma.clash.findMany({
      where: { dateTime: { gt: new Date() }, ...matchesArea },
      orderBy: { dateTime: "asc" },
      take: 20,
      include: { venue: true },
    });
    if (clashes.length === 0) return reply("No upcoming clashes found.");
    const lines = clashes.map(
      (c) => `${c.dateTime.toISOString()} | ${c.title} | ${c.venue?.title ?? "no venue"} | id ${c.id}`,
    );
    return reply(lines.join("\n"));
  },
);

// Step 2 of task 19: register find_venue here.

// Step 3 of task 19: register create_clash here.

// Step 4 of task 19: register cancel_clash here.

async function main() {
  await server.connect(new StdioServerTransport());
  log(`ready, database ${dbFile}`);
}

main().catch((error) => {
  log(`failed to start: ${error}`);
  process.exit(1);
});
