import { readEnv } from "@/lib/dynamodb/env";
import { stubAuthAdapter } from "@/lib/auth/adapters/stub";
import type { AppSession, AuthAdapter, AuthError } from "@/lib/auth/types";

/**
 * Active auth adapter.
 * Uses Cognito when COGNITO_USER_POOL_ID is configured,
 * otherwise falls back to the dev stub.
 */
function resolveAdapter(): AuthAdapter {
  const poolId = readEnv("COGNITO_USER_POOL_ID");
  if (poolId) {
    // Dynamic import avoids pulling Cognito deps when using the stub
    const { cognitoAuthAdapter } =
      require("@/lib/auth/adapters/cognito") as typeof import("@/lib/auth/adapters/cognito");
    return cognitoAuthAdapter;
  }
  return stubAuthAdapter;
}

let _adapter: AuthAdapter | null = null;
function getAdapter(): AuthAdapter {
  if (!_adapter) {
    _adapter = resolveAdapter();
  }
  return _adapter;
}

export async function getSession(): Promise<AppSession | null> {
  return getAdapter().getSession();
}

export async function requireSession(): Promise<
  { ok: true; session: AppSession } | { ok: false; error: AuthError }
> {
  const session = await getSession();
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
  return Response.json({ error: "Admin access required" }, { status: 403 });
}
