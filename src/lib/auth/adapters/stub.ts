import { readEnv } from "@/lib/dynamodb/env";
import type { AppSession } from "@/lib/auth/types";

/**
 * Development stub — active when COGNITO_USER_POOL_ID is not set.
 * Set AUTH_DEV_ROLE=admin (default in development).
 */
export function getDevSession(): AppSession | null {
    if (process.env.NODE_ENV === "production") return null;
    const configured = readEnv("AUTH_DEV_ROLE")?.trim().toLowerCase();
    const isAdmin =
      configured === "admin" ||
      !configured

    if (!isAdmin && configured !== "student") {
      return null;
    }

    return {
      userId: "dev-user",
      role: isAdmin ? "admin" : "student",
      displayName: isAdmin ? "Dev Officer" : "Dev Student",
      studentId: readEnv("AUTH_DEV_STUDENT_ID"),
      email: "dev@localhost",
      organizationId: readEnv("AUTH_DEV_ORGANIZATION_ID"),
    };
}
