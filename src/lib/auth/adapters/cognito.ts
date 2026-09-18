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
    const groups: string[] = payload["cognito:groups"] ?? [];
    if (!groups.includes(adminGroup)) {
      return null;
    }

    return {
      userId: payload.sub,
      role: "admin",
      displayName:
        payload["cognito:username"] ?? payload.email ?? payload.sub,
      email: payload.email,
    };
  },
};

export { SESSION_COOKIE };
