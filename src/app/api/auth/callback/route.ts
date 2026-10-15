import { NextRequest, NextResponse } from "next/server";
import { exchangeAuthorizationCode, safeReturnPath } from "@/lib/auth/cognito";
import { applyTokenCookies, clearOauthCookies, OAUTH_NEXT_COOKIE, OAUTH_NONCE_COOKIE, OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, verifyAccessToken, verifyIdToken } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expected = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const verifier = request.cookies.get(OAUTH_VERIFIER_COOKIE)?.value;
  const nonce = request.cookies.get(OAUTH_NONCE_COOKIE)?.value;
  const next = safeReturnPath(request.cookies.get(OAUTH_NEXT_COOKIE)?.value);
  const home = new URL("/", request.url);

  // A stale Cognito return must not erase the PKCE cookies of a newer sign-in.
  if (request.nextUrl.searchParams.has("error") || !code || !state || state !== expected) {
    return NextResponse.redirect(home);
  }

  if (!verifier || !nonce) {
    const response = NextResponse.redirect(new URL("/api/auth/login", request.url));
    clearOauthCookies(response.cookies);
    return response;
  }

  try {
    const tokens = await exchangeAuthorizationCode(code, verifier);
    if (!tokens.idToken) throw new Error("Missing ID token");
    const [id, access] = await Promise.all([verifyIdToken(tokens.idToken, nonce), verifyAccessToken(tokens.accessToken)]);
    if (access.status !== "ok" || id.sub !== access.session.userId) throw new Error("Invalid token pair");
    const response = NextResponse.redirect(new URL(next, request.url));
    clearOauthCookies(response.cookies);
    applyTokenCookies(response.cookies, tokens);
    return response;
  } catch (error) {
    console.error("Cognito callback failed:", error);
    const response = NextResponse.redirect(home);
    clearOauthCookies(response.cookies);
    return response;
  }
}
