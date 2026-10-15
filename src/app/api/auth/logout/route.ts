import { NextRequest, NextResponse } from "next/server";
import { getLogoutUrl, revokeRefreshToken } from "@/lib/auth/cognito";
import { isCognitoConfigured } from "@/lib/auth/config";
import { clearAuthCookies, REFRESH_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(REFRESH_COOKIE)?.value;
  if (token) {
    try { await revokeRefreshToken(token); } catch { console.error("Cognito token revocation failed"); }
  }
  const response = NextResponse.redirect(isCognitoConfigured() ? getLogoutUrl() : new URL("/", request.url), 303);
  clearAuthCookies(response.cookies);
  return response;
}

export const POST = GET;
