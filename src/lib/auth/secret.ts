/**
 * ===========================================================================
 *  SIGNING SECRET RESOLUTION
 * ===========================================================================
 *
 *  Both session mechanisms in this app used to fall back to a hardcoded string
 *  when their env var was unset:
 *
 *      lib/auth/options.ts    "findusonweb_nextauth_secret_key_2026"
 *      lib/cp/auth/session.ts "digitalexpo_cp_session_secret_change_me_2026"
 *
 *  Neither env var was set in production, so those literals were the live
 *  signing keys — and this repository is public, so the keys were too. Anyone
 *  who read them could mint a session token the app would accept.
 *
 *  The fallback now exists only outside production, and only so a fresh local
 *  checkout runs without setup. In production a missing secret throws, which
 *  fails a deploy loudly instead of quietly signing with a published key.
 *
 *  Deliberately dependency-free: this is imported by src/proxy.ts, which runs on
 *  the edge runtime and cannot pull in Prisma or anything Node-only.
 */

function resolve(envVar: string, value: string | undefined, devFallback: string): string {
  const trimmed = value?.trim();
  if (trimmed) return trimmed;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `${envVar} is not set. Refusing to sign sessions with a fallback secret in production — ` +
        `this repository is public, so any committed default is known to everyone. Set ${envVar} ` +
        `in the deployment's environment variables.`
    );
  }
  return devFallback;
}

/** next-auth's JWT signing key. Used by lib/auth/options.ts and by the edge proxy. */
export function nextAuthSecret(): string {
  return resolve("NEXTAUTH_SECRET", process.env.NEXTAUTH_SECRET, "dev-only-nextauth-secret-not-for-production");
}

/** The CP admin session cookie's signing key (lib/cp/auth/session.ts). */
export function cpSessionSecret(): string {
  return resolve("CP_SESSION_SECRET", process.env.CP_SESSION_SECRET, "dev-only-cp-session-secret-not-for-production");
}
