import { NextResponse, type NextRequest } from "next/server";
import { CP_SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/cp/auth/session";

/**
 * Route protection for the Admin Control Panel (/cp/**). Previously a no-op (empty matcher) —
 * scoping the matcher to just /cp/:path* means this can't affect any existing frontend route,
 * per the "do NOT break the existing frontend" constraint. /cp/login itself is excluded so an
 * unauthenticated admin can actually reach the sign-in form instead of redirect-looping.
 *
 * This only checks that a validly-signed, unexpired session exists — it does NOT check
 * per-route permissions (that's requireCpPermission() in lib/cp/rbac.ts, called from each
 * page/Server Action, since only Server Components/Actions can redirect with page-specific
 * context). Edge runtime can't use Node's `crypto` module, which is exactly why
 * lib/cp/auth/session.ts's verify() is built on the Web Crypto API instead.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(CP_SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    const loginUrl = new URL("/cp/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cp/((?!login).*)"],
};
