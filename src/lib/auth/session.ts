import "server-only";

import { CognitoJwtVerifier } from "aws-jwt-verify";
import { JwtExpiredError } from "aws-jwt-verify/error";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getCognitoConfig, isCognitoConfigured } from "@/lib/auth/config";
import { refreshAccessToken, type CognitoTokenSet } from "@/lib/auth/cognito";
import { isOfficer } from "@/lib/auth/roles";
import { getDevSession } from "@/lib/auth/adapters/stub";
import type { AppSession, AuthError } from "@/lib/auth/types";
import { ACCESS_COOKIE, ID_COOKIE as ID_TOKEN_COOKIE, REFRESH_COOKIE, OAUTH_STATE_COOKIE, OAUTH_NONCE_COOKIE, OAUTH_VERIFIER_COOKIE, OAUTH_NEXT_COOKIE } from "@/lib/auth/cookie-names";
export { ACCESS_COOKIE, ID_COOKIE, REFRESH_COOKIE, OAUTH_STATE_COOKIE, OAUTH_NONCE_COOKIE, OAUTH_VERIFIER_COOKIE, OAUTH_NEXT_COOKIE } from "@/lib/auth/cookie-names";

type CookieWriter = Pick<Awaited<ReturnType<typeof cookies>>, "set" | "delete">;
const oauthCookies = [OAUTH_STATE_COOKIE, OAUTH_NONCE_COOKIE, OAUTH_VERIFIER_COOKIE, OAUTH_NEXT_COOKIE];
const options = (maxAge: number) => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge });
let accessVerifier: ReturnType<typeof CognitoJwtVerifier.create> | undefined;
let idVerifier: ReturnType<typeof CognitoJwtVerifier.create> | undefined;

export type AccessVerification =
  | { status: "ok"; session: AppSession }
  | { status: "expired" | "invalid" | "missing" };

export function applyTokenCookies(store: CookieWriter, tokens: CognitoTokenSet) {
  store.set(ACCESS_COOKIE, tokens.accessToken, options(60 * 60 * 24 * 30));
  if (tokens.idToken) store.set(ID_TOKEN_COOKIE, tokens.idToken, options(60 * 60 * 24 * 30));
  if (tokens.refreshToken) store.set(REFRESH_COOKIE, tokens.refreshToken, options(60 * 60 * 24 * 30));
  store.delete("arcus_session");
}

export function clearOauthCookies(store: CookieWriter) {
  oauthCookies.forEach((name) => store.delete(name));
}

export function clearAuthCookies(store: CookieWriter) {
  [ACCESS_COOKIE, ID_TOKEN_COOKIE, REFRESH_COOKIE, "arcus_session"].forEach((name) => store.delete(name));
  clearOauthCookies(store);
}

export function applyOauthCookies(store: CookieWriter, values: { nextPath: string; nonce: string; state: string; verifier: string }) {
  store.set(OAUTH_NEXT_COOKIE, values.nextPath, options(600));
  store.set(OAUTH_NONCE_COOKIE, values.nonce, options(600));
  store.set(OAUTH_STATE_COOKIE, values.state, options(600));
  store.set(OAUTH_VERIFIER_COOKIE, values.verifier, options(600));
}

export async function verifyAccessToken(token: string | undefined): Promise<AccessVerification> {
  if (!token) return { status: "missing" };
  try {
    const config = getCognitoConfig();
    accessVerifier ??= CognitoJwtVerifier.create({ userPoolId: config.userPoolId, clientId: config.clientId, tokenUse: "access" });
    const payload = await accessVerifier.verify(token);
    const claim = (name: string) => typeof payload[name] === "string" ? (payload[name] as string).trim() || undefined : undefined;
    const groups = Array.isArray(payload["cognito:groups"]) ? payload["cognito:groups"].filter((group): group is string => typeof group === "string") : [];
    const organizationId = claim("custom:organization_id");
    return { status: "ok", session: {
      userId: payload.sub,
      displayName: claim("username") ?? payload.sub,
      organizationId,
      studentId: claim("custom:student_id"),
      role: isOfficer({ organizationId, groups }, [config.adminGroup, config.superAdminGroup]) ? "admin" : "student",
    } };
  } catch (error) {
    return { status: error instanceof JwtExpiredError ? "expired" : "invalid" };
  }
}

export async function verifyIdToken(token: string, nonce?: string) {
  const config = getCognitoConfig();
  idVerifier ??= CognitoJwtVerifier.create({ userPoolId: config.userPoolId, clientId: config.clientId, tokenUse: "id" });
  return idVerifier.verify(token, { customJwtCheck: ({ payload }) => {
    if (nonce !== undefined && payload.nonce !== nonce) throw new Error("ID token nonce mismatch");
  } });
}

type IdTokenClaims = { organizationId?: string; studentId?: string; sub: string };

/** Custom attributes live on the ID token. Access tokens omit them unless a pre-token trigger copies them. */
async function readIdTokenClaims(token: string | undefined): Promise<IdTokenClaims | null> {
  if (!token) return null;
  try {
    const payload = await verifyIdToken(token);
    const claim = (name: string) => typeof payload[name] === "string" ? payload[name].trim() || undefined : undefined;
    return { organizationId: claim("custom:organization_id"), studentId: claim("custom:student_id"), sub: payload.sub };
  } catch {
    return null;
  }
}

function withIdTokenClaims(verified: AccessVerification, claims: IdTokenClaims | null): AccessVerification {
  if (verified.status !== "ok" || !claims || claims.sub !== verified.session.userId) return verified;
  const organizationId = verified.session.organizationId ?? claims.organizationId;
  return {
    status: "ok",
    session: {
      ...verified.session,
      organizationId,
      studentId: verified.session.studentId ?? claims.studentId,
      role: organizationId ? "admin" : verified.session.role,
    },
  };
}

export async function verifyAccessCookie(): Promise<AccessVerification> {
  if (!isCognitoConfigured()) {
    const session = getDevSession();
    return session ? { status: "ok", session } : { status: "missing" };
  }
  const jar = await cookies();
  const verified = await verifyAccessToken(jar.get(ACCESS_COOKIE)?.value);
  return withIdTokenClaims(verified, await readIdTokenClaims(jar.get(ID_TOKEN_COOKIE)?.value));
}

// Server components only read cookies; refresh writes happen in route handlers.
export const getSession = cache(async (): Promise<AppSession | null> => {
  const verified = await verifyAccessCookie();
  return verified.status === "ok" ? verified.session : null;
});

export async function requirePageSession(returnPath: string, officerOnly = false): Promise<AppSession> {
  const session = await getSession();
  if (session) {
    if (officerOnly && session.role !== "admin") redirect("/forbidden");
    return session;
  }
  const jar = await cookies();
  const route = jar.get(REFRESH_COOKIE)?.value ? "refresh" : "login";
  redirect(`/api/auth/${route}?next=${encodeURIComponent(returnPath)}`);
}

export async function requireSession(): Promise<
  { ok: true; session: AppSession } | { ok: false; error: AuthError }
> {
  let session = await getSession();
  if (!session && isCognitoConfigured()) {
    const jar = await cookies();
    const refreshToken = jar.get(REFRESH_COOKIE)?.value;
    if (refreshToken) {
      try {
        const tokens = await refreshAccessToken(refreshToken);
        const verified = withIdTokenClaims(
          await verifyAccessToken(tokens.accessToken),
          await readIdTokenClaims(tokens.idToken),
        );
        if (verified.status === "ok") {
          applyTokenCookies(jar, tokens);
          session = verified.session;
        }
      } catch {
        // An API returns 401; page guards use the refresh route instead.
      }
    }
  }
  if (!session) {
    return { ok: false, error: { status: "unauthenticated" } };
  }
  return { ok: true, session };
}

export async function requireAdmin(): Promise<
  { ok: true; session: AppSession } | { ok: false; error: AuthError }
> {
  const result = await requireSession();
  if (!result.ok) {
    return result;
  }
  if (result.session.role !== "admin") {
    return {
      ok: false,
      error: { status: "forbidden", role: result.session.role },
    };
  }
  return result;
}

/** @deprecated Use requireAdmin instead */
export const requireOfficer = requireAdmin;

export function authErrorResponse(error: AuthError): Response {
  if (error.status === "unauthenticated") {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  return Response.json({ error: "Officer access required" }, { status: 403 });
}
