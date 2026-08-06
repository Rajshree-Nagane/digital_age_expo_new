let PrismaClient: any;
let hasGeneratedClient = false;

try {
  PrismaClient = require("../generated/prisma").PrismaClient;
  hasGeneratedClient = true;
} catch {
  try {
    PrismaClient = require("@prisma/client").PrismaClient;
    hasGeneratedClient = true;
  } catch {
    hasGeneratedClient = false;
  }
}

let PrismaMariaDb: any;
try {
  PrismaMariaDb = require("@prisma/adapter-mariadb").PrismaMariaDb;
} catch {
  PrismaMariaDb = null;
}

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

const createMockPrisma = () => {
  const handler: ProxyHandler<any> = {
    get(target: any, prop: string): any {
      if (prop === "$transaction") {
        return async (arg: any) => {
          if (Array.isArray(arg)) {
            return Promise.all(arg);
          }
          if (typeof arg === "function") {
            return arg(createMockPrisma());
          }
          return [];
        };
      }
      if (prop === "findUniqueOrThrow" || prop === "findUnique" || prop === "findFirst") {
        return async () => {
          if (target._modelName === "find_domains") {
            return {
              id: 150,
              name: "Digital Age Expo",
              brand: "Digital Age Expo",
              event_id: 852,
              linked_profile_listing_id: 810210,
              email: "info@findusonweb.com",
              phone: "0123456789",
              partner_url: "",
              facebook: "",
              instagram: "",
              youtube: "",
              linkedin: "",
              twitter: "",
            };
          }
          if (target._modelName === "find_events") {
            return {
              id: 852,
              listing_id: 810210,
              title: "Digital Age Expo 2026",
              label: "The UK's Premier Tech & Business Event",
              venue: "London Olympia",
              location: "London",
              date_start: new Date(Date.now() + 86400000 * 30),
              date_end: new Date(Date.now() + 86400000 * 32),
              previous_event_id: null,
              hide_speaker: false,
              email: "expo@findusonweb.com",
              phone: "0123456789",
            };
          }
          if (target._modelName === "find_events_dates") {
            return {
              date_start: new Date(Date.now() + 86400000 * 30),
              date_end: new Date(Date.now() + 86400000 * 32),
            };
          }
          return null;
        };
      }
      if (prop === "findMany" || prop === "groupBy") {
        return async () => [];
      }
      if (prop === "count") {
        return async () => 0;
      }
      if (prop === "aggregate") {
        return async () => ({ _count: 0, _sum: {}, _avg: {}, _min: {}, _max: {} });
      }
      if (
        prop === "create" ||
        prop === "update" ||
        prop === "delete" ||
        prop === "upsert" ||
        prop === "updateMany" ||
        prop === "deleteMany"
      ) {
        return async (args: any) => args?.data ?? { count: 1 };
      }
      if (typeof prop === "string" && prop !== "then" && prop !== "catch" && prop !== "finally") {
        return new Proxy({ _modelName: prop }, handler);
      }
      return undefined;
    },
  };
  return new Proxy({}, handler);
};

/**
 * The mariadb driver defaults connectionLimit to 10 when none is set — fine for a single
 * short-lived request, but this app fans a lot of independent findMany/findFirst calls out via
 * Promise.all per page (home page alone kicks off ~9 top-level queries, one of which itself
 * fires 6 more), and Next dev (Turbopack HMR + React double-invoke) piles concurrent renders on
 * top of that. That saturates a 10-connection pool quickly and later requests time out waiting
 * for a free connection ("pool timeout ... active=8 idle=0 limit=10"). Bump the pool via query
 * params, which the mariadb driver parses out of the connection string (see
 * mariadb/lib/config/pool-options.js). Tunable via env so prod can size it to its own DB limits.
 */
function withPoolTuning(url: string): string {
  const connectionLimit = Number(process.env.DATABASE_POOL_SIZE) || 25;
  // Keep this well under Prisma/Next's own request handling budget. If the underlying MariaDB
  // server can't hand out a connection (e.g. it's hit its own max_connections, or a stray/zombie
  // dev server process is squatting on connections), we want a clear error in a few seconds, not
  // a multi-minute hang — that's a server-side problem to go fix, not something to wait out.
  const acquireTimeout = Number(process.env.DATABASE_POOL_ACQUIRE_TIMEOUT_MS) || 8000;
  const connectTimeout = Number(process.env.DATABASE_CONNECT_TIMEOUT_MS) || 5000;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connectionLimit=${connectionLimit}&acquireTimeout=${acquireTimeout}&connectTimeout=${connectTimeout}`;
}

let prismaInstance: any;

const dbUrl = process.env.DATABASE_URL;
if (
  hasGeneratedClient &&
  dbUrl &&
  dbUrl.trim() !== "" &&
  !dbUrl.includes("localhost") &&
  !dbUrl.includes("root:password")
) {
  if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma;
  } else {
    try {
      if (!PrismaMariaDb) {
        throw new Error(
          "@prisma/adapter-mariadb is not installed. Prisma 7 requires an explicit driver adapter " +
            "to connect to MySQL/MariaDB — run `npm install @prisma/adapter-mariadb`."
        );
      }
      const adapter = new PrismaMariaDb(withPoolTuning(dbUrl));
      prismaInstance = new PrismaClient({ adapter });
      if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = prismaInstance;
      }
    } catch (err) {
      console.error(
        "[prisma] Falling back to mock client — the app will appear to run but ALL database " +
          "reads/writes will silently return empty data. Root cause:",
        err
      );
      prismaInstance = createMockPrisma();
    }
  }
} else {
  prismaInstance = createMockPrisma();
}

export const prisma = prismaInstance;
