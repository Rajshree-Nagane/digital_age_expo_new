import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/options";

const handler = NextAuth(authOptions);

// Next.js 15+ made the route handler's `params` argument a Promise (the "Async Request APIs"
// change), but next-auth v4's built-in handler still destructures `params.nextauth`
// synchronously. Left as-is, every request under /api/auth/* (including the "session" check
// every page fires on mount) throws internally, and Next's dev server returns its own HTML
// error page instead of JSON — which is what next-auth's client sees as a CLIENT_FETCH_ERROR
// ("Unexpected token '<'"). Awaiting params here before forwarding to the handler restores the
// shape next-auth v4 expects.
type NextAuthRouteContext = { params: Promise<{ nextauth: string[] }> };

export async function GET(req: Request, context: NextAuthRouteContext) {
  return handler(req, { params: await context.params });
}

export async function POST(req: Request, context: NextAuthRouteContext) {
  return handler(req, { params: await context.params });
}
