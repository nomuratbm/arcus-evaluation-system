export type AppRole = "admin";

export type AppSession = {
  userId: string;
  role: AppRole;
  displayName: string;
  email?: string;
};

/**
 * Auth adapter at the session seam.
 * Cognito replaces the stub without changing callers.
 */
export type AuthAdapter = {
  getSession(): Promise<AppSession | null>;
};

export type AuthError =
  | { status: "unauthenticated" }
  | { status: "forbidden"; role: string };
