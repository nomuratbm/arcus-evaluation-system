/**
 * Pure, dependency-free role logic so it can be unit tested without the
 * server-only session module. An "officer" is either an organization account
 * (its token carries a `custom:organization_id` claim) or a member of one of
 * the officer groups. Everyone else is a "student": they land on `/`, pick an
 * event they attended, and file their own FM-SA-05-01 evaluation. Officers are
 * routed to the org-scoped `/officer` dashboard and are never treated as
 * students.
 */

export type SessionClaims = {
  organizationId?: string | null;
  groups?: string[] | null;
};

/**
 * @param claims      Verified token claims for the current session.
 * @param adminGroups Group names that grant officer access even without an
 *                    organization claim (super-admin / org-submitter / admin).
 */
export function isOfficer(
  claims: SessionClaims,
  adminGroups: readonly string[],
): boolean {
  if (typeof claims.organizationId === "string" && claims.organizationId.trim()) {
    return true;
  }

  const groups = claims.groups ?? [];
  return adminGroups.some((group) => groups.includes(group));
}

/** An organization account is specifically the claim-bearing kind of officer. */
export function isOrganizationAccount(claims: SessionClaims): boolean {
  return (
    typeof claims.organizationId === "string" &&
    claims.organizationId.trim().length > 0
  );
}

/** Where a signed-in user should land: officers run the dashboard, students evaluate. */
export function landingPath(
  claims: SessionClaims,
  adminGroups: readonly string[],
): "/" | "/officer" {
  return isOfficer(claims, adminGroups) ? "/officer" : "/";
}
