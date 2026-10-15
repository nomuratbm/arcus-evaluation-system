export type CognitoConfig = {
  adminGroup: string;
  appBaseUrl: string;
  orgSubmitterGroup: string;
  superAdminGroup: string;
  clientId: string;
  clientSecret: string;
  domain: string;
  logoutUri: string;
  redirectUri: string;
  userPoolId: string;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }
  return value;
}

/** True when the Cognito env vars needed for real auth are present. */
export function isCognitoConfigured(): boolean {
  return Boolean(process.env.COGNITO_USER_POOL_ID?.trim());
}

export function getCognitoConfig(): CognitoConfig {
  const appBaseUrl = required("APP_BASE_URL").replace(/\/$/, "");
  const domain = required("COGNITO_DOMAIN")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  return {
    adminGroup: process.env.COGNITO_ADMIN_GROUP?.trim() || "admin",
    appBaseUrl,
    orgSubmitterGroup:
      process.env.COGNITO_ORG_SUBMITTER_GROUP?.trim() || "org_submitter",
    superAdminGroup: process.env.COGNITO_SUPER_ADMIN_GROUP?.trim() || "admin",
    clientId: required("COGNITO_CLIENT_ID"),
    clientSecret: process.env.COGNITO_CLIENT_SECRET?.trim() || "",
    domain,
    logoutUri: `${appBaseUrl}/`,
    redirectUri: `${appBaseUrl}/api/auth/callback`,
    userPoolId: required("COGNITO_USER_POOL_ID"),
  };
}
