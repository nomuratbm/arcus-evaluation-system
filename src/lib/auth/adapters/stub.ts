import { readEnv } from "@/lib/dynamodb/env";
import type { AppSession, AuthAdapter } from "@/lib/auth/types";

/**
 * Development stub — active when COGNITO_USER_POOL_ID is not set.
 * Set AUTH_DEV_ROLE=admin (default in development).
 */
export const stubAuthAdapter: AuthAdapter = {
  async getSession(): Promise<AppSession | null> {
    const configured = readEnv("AUTH_DEV_ROLE")?.trim().toLowerCase();
    const isAdmin =
      configured === "admin" ||
      (!configured && process.env.NODE_ENV !== "production");

    if (!isAdmin) {
      return null;
    }

    return {
      userId: "dev-user",
      role: "admin",
      displayName: "Dev Admin",
      email: "dev@localhost",
    };
  },
};
