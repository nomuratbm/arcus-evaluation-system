import { NextRequest, NextResponse } from "next/server";
import { refreshAccessToken, safeReturnPath } from "@/lib/auth/cognito";
import { applyTokenCookies, clearAuthCookies, REFRESH_COOKIE, verifyAccessToken } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const next = safeReturnPath(request.nextUrl.searchParams.get("next"));
  const login = new URL("/api/auth/login", request.url);
  login.searchParams.set("next", next);
  try {
    const token = request.cookies.get(REFRESH_COOKIE)?.value;
    if (!token) throw new Error("Missing refresh token");
    const tokens = await refreshAccessToken(token);
    if ((await verifyAccessToken(tokens.accessToken)).status !== "ok") throw new Error("Invalid access token");
    const response = NextResponse.redirect(new URL(next, request.url));
    applyTokenCookies(response.cookies, tokens);
    return response;
  } catch {
    const response = NextResponse.redirect(login);
    clearAuthCookies(response.cookies);
    return response;
  }
}
