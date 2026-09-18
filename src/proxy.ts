import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy — the Next.js 16 replacement for middleware.
 *
 * Protects /officer/* and /export/* routes by checking for
 * the session cookie. This is the first line of defense;
 * layout-level guards provide defense-in-depth.
 *
 * Note: We only do an optimistic cookie-presence check here.
 * Full JWT verification happens in the auth adapter (server-side).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes
  const isAdminRoute =
    pathname.startsWith("/officer") || pathname.startsWith("/export");

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  // Check for session cookie (optimistic — not verifying JWT here)
  const sessionCookie = request.cookies.get("arcus_session");

  if (!sessionCookie?.value) {
    // No session → redirect to login
    const loginUrl = new URL("/api/auth/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match admin routes only:
     * - /officer and its sub-routes
     * - /export and its sub-routes
     * Exclude static files, images, and API routes (APIs have their own guards).
     */
    "/officer/:path*",
    "/export/:path*",
  ],
};
