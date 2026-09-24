// Smoke test for mcp/server.ts. Starts the server as a child process, then
// calls every tool once and checks the answers. Run: npx tsx mcp/smoke.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const here = path.dirname(fileURLToPath(import.meta.url));

// Direct database access, only to remove the clash this test creates.
const dbFile = path.join(here, "..", "dev.db");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: `file:${dbFile}` }) });

// Start from the mcp/ folder, not the clash root, on purpose: the server must
// still find <clash root>/dev.db, because it resolves the path from its own file.
const transport = new StdioClientTransport({
  command: "npx",
  args: ["tsx", path.join(here, "server.ts")],
  cwd: here,
  stderr: "inherit",
});
const client = new Client({ name: "clash-smoke", version: "1.0.0" });

let failures = 0;
let createdId: string | undefined; // the clash this test created, removed in the finally below
// One marker per run: cleanup removes only clashes this run created, never someone else's data.
const TEST_DESCRIPTION = `Build MCP servers together. Created by the smoke test, run ${randomUUID()}.`;

// Call one tool and return its text answer and whether the server flagged it as an error.
// A tool that does not exist yet (the starter on CLASH's 19-start) counts as a failed check, not a crash,
// so every check still prints PASS or FAIL and shows which steps are left.
async function call(name: string, args: Record<string, unknown>): Promise<{ text: string; isError: boolean }> {
  let result;
  try {
    result = await client.callTool({ name, arguments: args });
  } catch (error) {
    const text = `not available: ${error instanceof Error ? error.message : String(error)}`;
    console.log(`\n> ${name}(${JSON.stringify(args)}) [not available]\n${text}`);
    return { text, isError: true };
  }
  const first = (result.content as Array<{ type: string; text?: string }>)[0];
  const text = first?.text ?? JSON.stringify(result);
  const isError = (result as { isError?: boolean }).isError === true;
  console.log(`\n> ${name}(${JSON.stringify(args)})${isError ? " [isError]" : ""}\n${text}`);
  return { text, isError };
}

function expect(label: string, ok: boolean) {
  console.log(ok ? `PASS ${label}` : `FAIL ${label}`);
  if (!ok) failures += 1;
}

async function main() {
await client.connect(transport);

const { tools } = await client.listTools();
expect("four tools registered", tools.length === 4);
expect(
  "tool names",
  ["cancel_clash", "create_clash", "find_venue", "list_upcoming_clashes"].every((n) => tools.some((t) => t.name === n)),
);

const venues = await call("find_venue", { query: "holzmarkt" });
let venue: { id: string; title: string } | undefined;
try {
  venue = (JSON.parse(venues.text) as Array<{ id: string; title: string }>)[0];
} catch {
  venue = undefined; // no JSON array: find_venue is missing or answers the wrong shape
}
expect("find_venue finds Holzmarkt 25 (case does not matter)", venue?.title === "Holzmarkt 25" && !venues.isError);

const none = await call("find_venue", { query: "nowhere" });
expect("find_venue with no match answers with text, not an error", none.text.startsWith("No venue matches") && !none.isError);

const upcoming = await call("list_upcoming_clashes", { area: "Holzmarkt" });
expect("list_upcoming_clashes never shows a past clash", !upcoming.text.includes("Open Source Hacknight") && !upcoming.isError);

const all = await call("list_upcoming_clashes", {});
expect("list_upcoming_clashes without area lists the seeded upcoming clashes", all.text.includes("React Berlin Clash") && !all.isError);

// Far ahead, computed now, so the test never goes stale.
const farAhead = new Date();
farAhead.setFullYear(farAhead.getFullYear() + 1);
farAhead.setHours(19, 0, 0, 0);
const draft = {
  title: "MCP Hacknight",
  description: TEST_DESCRIPTION,
  dateTime: farAhead.toISOString(),
  venueId: venue?.id ?? "no-venue-found",
  hostEmail: "anna.schmidt@example.com",
};

const created = await call("create_clash", draft);
createdId = created.text.match(/^Created clash (\S+):/)?.[1];
expect("create_clash creates the clash", created.text.startsWith("Created clash") && !created.isError);

// Every refusal must carry isError: true, not only the right text.
const again = await call("create_clash", draft);
expect("create_clash refuses the same title at the same time", again.text.startsWith("Duplicate:") && again.isError);

const unknownHost = await call("create_clash", { ...draft, hostEmail: "nobody@example.com" });
expect("create_clash refuses an unknown host", unknownHost.text.startsWith("No CLASH user with email") && unknownHost.isError);

const unknownVenue = await call("create_clash", { ...draft, title: "Elsewhere", venueId: "not-a-venue" });
expect("create_clash refuses an unknown venue", unknownVenue.text.startsWith("Unknown venue") && unknownVenue.isError);

const longAgo = new Date();
longAgo.setFullYear(longAgo.getFullYear() - 1);
const past = await call("create_clash", { ...draft, title: "Long ago", dateTime: longAgo.toISOString() });
expect("create_clash refuses a past date", past.text.startsWith("dateTime must be") && past.isError);

const garbage = await call("create_clash", { ...draft, title: "No date", dateTime: "someday" });
expect("create_clash refuses an invalid date", garbage.text.startsWith("dateTime must be") && garbage.isError);

// ISO in shape, but no such day: 2099 is not a leap year. new Date() alone would roll it to March 1.
const noSuchDay = await call("create_clash", { ...draft, title: "No such day", dateTime: "2099-02-29T19:00:00.000Z" });
expect("create_clash refuses a day that does not exist", noSuchDay.text.startsWith("dateTime must be") && noSuchDay.isError);

const listed = await call("list_upcoming_clashes", { area: "Holzmarkt" });
expect("the new clash shows up in list_upcoming_clashes", listed.text.includes("MCP Hacknight") && !listed.isError);

// cancel_clash: three refusals, then the one delete, only by the host who created the clash.
const cancelUnknownHost = await call("cancel_clash", { clashId: createdId, hostEmail: "nobody@example.com" });
expect("cancel_clash refuses an unknown host", cancelUnknownHost.text.startsWith("No CLASH user with email") && cancelUnknownHost.isError);

const cancelUnknownClash = await call("cancel_clash", { clashId: "not-a-clash", hostEmail: draft.hostEmail });
expect("cancel_clash refuses an unknown clash", cancelUnknownClash.text.startsWith("Unknown clash") && cancelUnknownClash.isError);

const otherHost = "lukas.mueller@example.com"; // a seeded user who did not create the test clash
const cancelOtherHost = await call("cancel_clash", { clashId: createdId, hostEmail: otherHost });
expect("cancel_clash refuses a host who did not create the clash", cancelOtherHost.text.startsWith(`${otherHost} did not create clash`) && cancelOtherHost.isError);

const cancelled = await call("cancel_clash", { clashId: createdId, hostEmail: draft.hostEmail });
expect("cancel_clash cancels the host's own clash", cancelled.text.startsWith("Cancelled clash") && !cancelled.isError);

const afterCancel = await call("list_upcoming_clashes", { area: "Holzmarkt" });
expect("the cancelled clash is gone from list_upcoming_clashes", !afterCancel.text.includes("MCP Hacknight") && !afterCancel.isError);
}

async function run() {
  try {
    await main();
  } finally {
    // Clean up on success and on failure: remove every clash this run created, so the database
    // looks like before. Matched by this run's own description, not only by createdId: a
    // create_clash that writes but answers with the wrong text leaves createdId undefined.
    // deleteMany, not delete: after a passing run cancel_clash has removed it already.
    await prisma.clash.deleteMany({
      where: createdId
        ? { OR: [{ id: createdId }, { description: TEST_DESCRIPTION }] }
        : { description: TEST_DESCRIPTION },
    });
    await prisma.$disconnect();
    await client.close();
  }
  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
