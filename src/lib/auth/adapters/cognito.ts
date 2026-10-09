import { cookies } from "next/headers";

import { readEnv } from "@/lib/dynamodb/env";
import type { AppSession, AuthAdapter } from "@/lib/auth/types";
import { verifyCognitoToken } from "@/lib/auth/jwt";

const SESSION_COOKIE = "arcus_session";

/**
 * Cognito auth adapter.
 * Reads the ID token from an HTTP-only cookie, verifies it,
 * and checks for "admin" group membership.
 */
export const cognitoAuthAdapter: AuthAdapter = {
  async getSession(): Promise<AppSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return null;
    }

    const payload = await verifyCognitoToken(token);
    if (!payload) {
      return null;
    }

    const adminGroup = readEnv("COGNITO_ADMIN_GROUP") || "admin";
    const orgSubmitterGroup =
      readEnv("COGNITO_ORG_SUBMITTER_GROUP") || "org_submitter";
    const groups: string[] = payload["cognito:groups"] ?? [];
    // Evaluation has a single authenticated tier: org_submitters operate it
    // with the same access as admins, so both map to role "admin".
    if (!groups.includes(adminGroup) && !groups.includes(orgSubmitterGroup)) {
      return null;
    }

    const rawOrganizationId = payload["custom:organization_id"];
    const organizationId =
      typeof rawOrganizationId === "string" && rawOrganizationId.trim()
        ? rawOrganizationId.trim()
        : undefined;

    return {
      userId: payload.sub,
      role: "admin",
      displayName:
        payload["cognito:username"] ?? payload.email ?? payload.sub,
      email: payload.email,
      organizationId,
    };
  },
};

export { SESSION_COOKIE };
