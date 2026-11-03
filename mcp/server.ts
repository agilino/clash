// CLASH MCP server: four tools over the CLASH database, spoken over stdio.
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

server.registerTool(
  "find_venue",
  {
    description: "Find venues whose title contains the query (case does not matter). At most 5.",
    inputSchema: z.object({ query: z.string().min(1) }),
  },
  async ({ query }) => {
    const venues = await prisma.venue.findMany({
      where: { title: { contains: query } },
      orderBy: { title: "asc" },
      take: 5,
      select: { id: true, title: true, latitude: true, longitude: true },
    });
    if (venues.length === 0) return reply(`No venue matches "${query}".`);
    return reply(JSON.stringify(venues, null, 2));
  },
);

server.registerTool(
  "create_clash",
  {
    description:
      "Create a clash at a known venue, hosted by an existing CLASH user. " +
      "Refuses unknown hosts, unknown venues, past or invalid dates, and duplicates.",
    inputSchema: z.object({
      title: z.string().min(1),
      description: z.string(),
      dateTime: z.string().describe("ISO date-time in the future"),
      venueId: z.string().describe("id from find_venue"),
      hostEmail: z.string().describe("email of the CLASH user who hosts the clash"),
    }),
  },
  async ({ title, description, dateTime, venueId, hostEmail }) => {
    const host = await prisma.user.findUnique({ where: { email: hostEmail } });
    if (!host) return refuse(`No CLASH user with email ${hostEmail}. Nothing was created.`);

    const venue = await prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) return refuse(`Unknown venue ${venueId}. Use find_venue to get a valid id.`);

    const when = new Date(dateTime);
    if (!isIsoDateTime(dateTime) || Number.isNaN(when.getTime()) || when <= new Date()) {
      return refuse("dateTime must be an ISO date-time in the future.");
    }

    const duplicate = await prisma.clash.findFirst({ where: { title, dateTime: when } });
    if (duplicate) {
      return refuse(`Duplicate: "${title}" already exists at ${when.toISOString()} (id ${duplicate.id}).`);
    }

    const clash = await prisma.clash.create({
      data: {
        title,
        description,
        dateTime: when,
        latitude: venue.latitude,
        longitude: venue.longitude,
        venueId: venue.id,
        creatorId: host.id,
      },
    });
    log(`created clash ${clash.id}`);
    return reply(`Created clash ${clash.id}: "${clash.title}" at ${clash.dateTime.toISOString()}.`);
  },
);

server.registerTool(
  "cancel_clash",
  {
    description:
      "Cancel a clash: delete it from CLASH. Only the CLASH user who created the clash can cancel it.",
    inputSchema: z.object({
      clashId: z.string().describe("id from create_clash or list_upcoming_clashes"),
      hostEmail: z.string().describe("email of the CLASH user who created the clash"),
    }),
  },
  async ({ clashId, hostEmail }) => {
    const host = await prisma.user.findUnique({ where: { email: hostEmail } });
    if (!host) return refuse(`No CLASH user with email ${hostEmail}. Nothing was deleted.`);

    const clash = await prisma.clash.findUnique({ where: { id: clashId } });
    if (!clash) return refuse(`Unknown clash ${clashId}. Use list_upcoming_clashes to find it.`);

    if (clash.creatorId !== host.id) {
      return refuse(`${hostEmail} did not create clash ${clashId}. Nothing was deleted.`);
    }

    await prisma.clash.delete({ where: { id: clash.id } });
    log(`cancelled clash ${clash.id}`);
    return reply(`Cancelled clash ${clash.id}: "${clash.title}".`);
  },
);

async function main() {
  await server.connect(new StdioServerTransport());
  log(`ready, database ${dbFile}`);
}

main().catch((error) => {
  log(`failed to start: ${error}`);
  process.exit(1);
});
