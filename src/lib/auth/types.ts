/**
 * "admin" is the officer tier (an organization account or a member of an
 * officer group) that reaches /officer; "student" is any other
 * authenticated user, who lands on / to file their own evaluation.
 */
export type AppRole = "admin" | "student";

export type AppSession = {
  userId: string;
  role: AppRole;
  displayName: string;
  email?: string;
  /**
   * mapua-apex organization scope from the Cognito `custom:organization_id`
   * claim. Present for org officers; absent for admins acting across every org
   * and for students. Used to scope server-to-server calls to the backend.
   */
  organizationId?: string;
  /**
   * The student's number from the Cognito `custom:student_id` claim. Present
   * for students who registered through arcus-attendance; used to identify
   * which evaluations they may file and which events they attended.
   */
  studentId?: string;
};

export type AuthError =
  | { status: "unauthenticated" }
  | { status: "forbidden"; role: string };
