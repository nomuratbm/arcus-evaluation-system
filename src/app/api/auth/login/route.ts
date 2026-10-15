import { NextRequest, NextResponse } from "next/server";
import { createPkce, createRandomValue, getAuthorizeUrl, safeReturnPath } from "@/lib/auth/cognito";
import { isCognitoConfigured } from "@/lib/auth/config";
import { applyOauthCookies, clearAuthCookies, verifyAccessCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const nextPath = safeReturnPath(request.nextUrl.searchParams.get("next"));
  if ((await verifyAccessCookie()).status === "ok") return NextResponse.redirect(new URL(nextPath, request.url));
  if (!isCognitoConfigured()) return NextResponse.json({ error: "Authentication is not configured" }, { status: 503 });
  const { challenge, verifier } = createPkce();
  const state = createRandomValue();
  const nonce = createRandomValue();
  const response = NextResponse.redirect(getAuthorizeUrl({ challenge, state, nonce }));
  clearAuthCookies(response.cookies);
  applyOauthCookies(response.cookies, { nextPath, nonce, state, verifier });
  return response;
}
