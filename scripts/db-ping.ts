/**
 * ===========================================================================
 *  DATABASE CONNECTIVITY DIAGNOSTIC
 * ===========================================================================
 *
 *  Run this when the app throws "timeout exceeded when trying to connect".
 *  It isolates WHERE the connection is failing — DNS, TCP, TLS/auth, or query
 *  — with no Next.js, no Prisma and no React in the way.
 *
 *      npx tsx scripts/db-ping.ts
 *      npx tsx scripts/db-ping.ts --timeout=30000     # be patient with a cold Neon compute
 *
 *  Exit code 0 = at least one endpoint is fully working.
 *
 *  WHY EACH LAYER MATTERS
 *    DNS fails   -> local resolver / VPN / offline
 *    TCP fails   -> firewall, corporate proxy, or ISP blocking port 5432 outbound,
 *                   OR the Neon project is suspended / over its compute quota
 *    TLS fails   -> certificate or sslmode problem
 *    auth fails  -> wrong password / rotated credentials
 *    query slow  -> Neon compute is cold-starting (usually fine, just wait)
 */

import * as dns from "node:dns/promises";
import * as net from "node:net";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

const flags = new Map<string, string>();
for (const a of process.argv.slice(2).filter((x) => x.startsWith("--"))) {
  const [k, v] = a.replace(/^--/, "").split("=");
  flags.set(k, v ?? "true");
}
const TIMEOUT = Number(flags.get("timeout") ?? 15000);

try {
  const dotenv = require("dotenv");
  dotenv.config({ path: path.join(ROOT, ".env") });
  dotenv.config({ path: path.join(ROOT, ".env.local"), override: false });
} catch {
  console.warn("! dotenv unavailable — relying on the ambient environment");
}

/** Hide the password but keep everything else readable. */
function mask(url: string): string {
  return url.replace(/(:\/\/[^:]+:)[^@]+@/, "$1********@");
}

interface Target {
  label: string;
  envVar: string;
  url: string;
}

const TARGETS: Target[] = [
  { label: "pooled   (what the app uses)", envVar: "DATABASE_URL", url: process.env.DATABASE_URL ?? "" },
  { label: "direct   (bypasses pgbouncer)", envVar: "DATABASE_URL_UNPOOLED", url: process.env.DATABASE_URL_UNPOOLED ?? "" },
].filter((t) => t.url);

const ms = (start: bigint) => Number((process.hrtime.bigint() - start) / 1_000_000n);

async function checkDns(host: string) {
  const t = process.hrtime.bigint();
  try {
    const addrs = await dns.lookup(host, { all: true });
    return { ok: true as const, ms: ms(t), detail: addrs.map((a) => a.address).join(", ") };
  } catch (e: any) {
    return { ok: false as const, ms: ms(t), detail: `${e.code ?? ""} ${e.message}`.trim() };
  }
}

function checkTcp(host: string, port: number) {
  return new Promise<{ ok: boolean; ms: number; detail: string }>((resolve) => {
    const t = process.hrtime.bigint();
    const sock = new net.Socket();
    const done = (ok: boolean, detail: string) => {
      sock.destroy();
      resolve({ ok, ms: ms(t), detail });
    };
    sock.setTimeout(TIMEOUT);
    sock.once("connect", () => done(true, "socket open"));
    sock.once("timeout", () => done(false, `no response within ${TIMEOUT}ms — port ${port} is being dropped (firewall/proxy) or the server is not accepting connections`));
    sock.once("error", (e: any) => done(false, `${e.code ?? ""} ${e.message}`.trim()));
    sock.connect(port, host);
  });
}

async function checkPostgres(url: string) {
  const { Client } = require("pg");
  // sslmode=require is treated as verify-full by pg-connection-string; Neon's cert
  // is CA-verifiable so that is what we want. Written explicitly to avoid the warning.
  const normalized = (() => {
    try {
      const u = new URL(url);
      const mode = u.searchParams.get("sslmode");
      if (mode && ["require", "prefer", "verify-ca"].includes(mode)) u.searchParams.set("sslmode", "verify-full");
      return u.toString();
    } catch {
      return url;
    }
  })();

  const client = new Client({ connectionString: normalized, connectionTimeoutMillis: TIMEOUT });
  const tConn = process.hrtime.bigint();
  try {
    await client.connect();
    const connMs = ms(tConn);
    const tQ = process.hrtime.bigint();
    const r = await client.query("select current_database() as db, version() as v, now() as at");
    const qMs = ms(tQ);
    await client.end();
    return {
      ok: true as const,
      connMs,
      qMs,
      detail: `${r.rows[0].db} | ${String(r.rows[0].v).split(",")[0]}`,
    };
  } catch (e: any) {
    try { await client.end(); } catch { /* already closed */ }
    return { ok: false as const, connMs: ms(tConn), qMs: 0, detail: `${e.code ?? ""} ${e.message}`.trim() };
  }
}

function verdict(target: string, stage: string, detail: string) {
  console.log(`\n  VERDICT for ${target}: failed at ${stage}`);
  const advice: Record<string, string[]> = {
    DNS: [
      "Your machine cannot resolve the Neon hostname.",
      "-> Check you are online; disable any VPN and retry.",
    ],
    TCP: [
      "The hostname resolves but nothing accepts a connection on port 5432.",
      "-> Most common cause: the Neon project is SUSPENDED or has exhausted its",
      "   free-tier compute quota. Open https://console.neon.tech and check the",
      "   project status — a suspended compute shows as Idle and should wake on",
      "   connect; a disabled/over-quota one will not.",
      "-> Second most common: a corporate firewall, VPN or ISP blocking outbound",
      "   5432. Try tethering to a phone hotspot to confirm.",
    ],
    POSTGRES: [
      "TCP works, so the network is fine — the failure is in TLS, auth, or the",
      "server refusing the session.",
      "-> 'password authentication failed' = credentials rotated; copy a fresh",
      "   connection string from the Neon dashboard into .env.",
      "-> 'too many connections' = stale dev servers are squatting on the pool.",
      "   Close them (Windows: Get-Process node | Stop-Process -Force) and retry.",
      "-> 'timeout' here with TCP OK usually means a cold compute; re-run with",
      "   --timeout=30000.",
    ],
  };
  for (const line of advice[stage] ?? []) console.log(`     ${line}`);
  console.log(`     raw: ${detail}`);
}

async function main() {
  console.log("=".repeat(72));
  console.log(" Database connectivity diagnostic");
  console.log(` per-stage timeout: ${TIMEOUT}ms`);
  console.log("=".repeat(72));

  if (TARGETS.length === 0) {
    console.error("\nNo DATABASE_URL or DATABASE_URL_UNPOOLED found in .env — nothing to test.");
    process.exit(1);
  }

  let anyOk = false;

  for (const t of TARGETS) {
    console.log(`\n${"-".repeat(72)}\n${t.label}  [${t.envVar}]`);
    console.log(`  ${mask(t.url)}`);

    let host: string;
    let port: number;
    try {
      const u = new URL(t.url);
      host = u.hostname;
      port = Number(u.port || 5432);
    } catch (e: any) {
      console.log(`  x URL is not parseable: ${e.message}`);
      continue;
    }

    const d = await checkDns(host);
    console.log(`  ${d.ok ? "+" : "x"} DNS       ${String(d.ms).padStart(6)}ms  ${d.detail}`);
    if (!d.ok) { verdict(t.envVar, "DNS", d.detail); continue; }

    const tcp = await checkTcp(host, port);
    console.log(`  ${tcp.ok ? "+" : "x"} TCP :${port}  ${String(tcp.ms).padStart(6)}ms  ${tcp.detail}`);
    if (!tcp.ok) { verdict(t.envVar, "TCP", tcp.detail); continue; }

    const pg = await checkPostgres(t.url);
    if (pg.ok) {
      console.log(`  + CONNECT   ${String(pg.connMs).padStart(6)}ms  TLS + auth OK`);
      console.log(`  + QUERY     ${String(pg.qMs).padStart(6)}ms  ${pg.detail}`);
      anyOk = true;
      if (pg.connMs > 5000) {
        console.log("\n  NOTE: connect took >5s — that is a Neon cold start, not a fault.");
        console.log("        The app's pool allows 15s; raise it with DATABASE_POOL_ACQUIRE_TIMEOUT_MS if needed.");
      }
    } else {
      console.log(`  x CONNECT   ${String(pg.connMs).padStart(6)}ms  ${pg.detail}`);
      verdict(t.envVar, "POSTGRES", pg.detail);
    }
  }

  console.log(`\n${"=".repeat(72)}`);
  if (anyOk) {
    console.log(" RESULT: the database is reachable. If the app still times out, the");
    console.log("         problem is connection exhaustion in a long-running dev server —");
    console.log("         stop every running `next dev`, then start a single one.");
  } else {
    console.log(" RESULT: no endpoint is reachable. Fix the layer named above before");
    console.log("         touching any application code — this is not a code bug.");
  }
  console.log("=".repeat(72));

  process.exit(anyOk ? 0 : 1);
}

main().catch((e) => {
  console.error("\nFATAL:", e?.stack ?? e);
  process.exit(1);
});
