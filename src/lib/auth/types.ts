export type AppRole = "admin";

export type AppSession = {
  userId: string;
  role: AppRole;
  displayName: string;
  email?: string;
  /**
   * mapua-apex organization scope from the Cognito `custom:organization_id`
   * claim. Present for org_submitters; absent for admins (who may act across
   * every org). Used to scope server-to-server calls to the backend.
   */
  organizationId?: string;
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
