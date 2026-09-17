import { readEnv } from "@/lib/dynamodb/env";
import type { AppRole, AppSession, AuthAdapter } from "@/lib/auth/types";

/**
 * Development stub until Cognito is wired.
 * Set AUTH_DEV_ROLE=officer|student (default officer in development).
 */
export const stubAuthAdapter: AuthAdapter = {
  async getSession(): Promise<AppSession | null> {
    const configured = readEnv("AUTH_DEV_ROLE")?.trim().toLowerCase();
    const role: AppRole =
      configured === "student" || configured === "officer"
        ? configured
        : process.env.NODE_ENV === "production"
          ? "student"
          : "officer";

    return {
      userId: "dev-user",
      role,
      displayName: role === "officer" ? "Dev Officer" : "Dev Student",
    };
  },
};
