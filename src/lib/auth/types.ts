export type AppRole = "student" | "officer";

export type AppSession = {
  userId: string;
  role: AppRole;
  displayName: string;
};

/**
 * Auth adapter at the session seam.
 * Cognito will replace the current stub without changing callers.
 */
export type AuthAdapter = {
  getSession(): Promise<AppSession | null>;
};

export type AuthError =
  | { status: "unauthenticated" }
  | { status: "forbidden"; role: AppRole };
