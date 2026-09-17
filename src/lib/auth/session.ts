import { stubAuthAdapter } from "@/lib/auth/adapters/stub";
import type { AppSession, AuthAdapter, AuthError } from "@/lib/auth/types";

/**
 * Active auth adapter. Swap to Cognito here when ready —
 * pages and APIs keep calling requireSession / requireOfficer only.
 */
const authAdapter: AuthAdapter = stubAuthAdapter;

export async function getSession(): Promise<AppSession | null> {
  return authAdapter.getSession();
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

export async function requireOfficer(): Promise<
  { ok: true; session: AppSession } | { ok: false; error: AuthError }
> {
  const result = await requireSession();
  if (!result.ok) {
    return result;
  }
  if (result.session.role !== "officer") {
    return {
      ok: false,
      error: { status: "forbidden", role: result.session.role },
    };
  }
  return result;
}

export function authErrorResponse(error: AuthError): Response {
  if (error.status === "unauthenticated") {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  return Response.json({ error: "Officer access required" }, { status: 403 });
}
