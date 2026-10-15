import "server-only";
import { createHash, randomBytes } from "node:crypto";

import { getCognitoConfig } from "@/lib/auth/config";

export type CognitoTokenSet = {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
};

type TokenEndpointResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
  id_token?: string;
  refresh_token?: string;
};

export function createRandomValue(): string {
  return randomBytes(32).toString("base64url");
}

export function createPkce(): { challenge: string; verifier: string } {
  const verifier = createRandomValue();
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { challenge, verifier };
}

export function getAuthorizeUrl(input: {
  challenge: string;
  nonce: string;
  state: string;
}): string {
  const config = getCognitoConfig();
  const url = new URL(`https://${config.domain}/oauth2/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", "openid");
  url.searchParams.set("code_challenge", input.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", input.state);
  url.searchParams.set("nonce", input.nonce);
  return url.toString();
}

export function getLogoutUrl(): string {
  const config = getCognitoConfig();
  const url = new URL(`https://${config.domain}/logout`);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("logout_uri", config.logoutUri);
  return url.toString();
}

/**
 * Allow-list of post-login return targets. `/` self-routes by role (officers
 * are redirected to `/officer`), so unknown or unsafe paths fall back to it.
 */
export function safeReturnPath(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/";
  }

  const url = new URL(value, "https://arcus.invalid");
  if (url.origin !== "https://arcus.invalid") return "/";
  if (["/", "/officer", "/export", "/forms", "/forms/submitted"].includes(url.pathname)) {
    return `${url.pathname}${url.search}`;
  }

  return "/";
}

export async function exchangeAuthorizationCode(
  code: string,
  verifier: string,
): Promise<CognitoTokenSet> {
  return requestTokens({
    code,
    code_verifier: verifier,
    grant_type: "authorization_code",
    redirect_uri: getCognitoConfig().redirectUri,
  });
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<CognitoTokenSet> {
  const tokens = await requestTokens({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  return {
    accessToken: tokens.accessToken,
    idToken: tokens.idToken,
    refreshToken: tokens.refreshToken ?? refreshToken,
  };
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  const config = getCognitoConfig();
  const response = await fetch(`https://${config.domain}/oauth2/revoke`, {
    body: new URLSearchParams({ token: refreshToken, client_id: config.clientId }),
    headers: config.clientSecret ? tokenRequestHeaders(config) : { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Cognito revoke failed with status ${response.status}`);
  }
}

async function requestTokens(
  body: Record<string, string>,
): Promise<CognitoTokenSet> {
  const config = getCognitoConfig();
  const payload = new URLSearchParams(body);

  // Public (PKCE) clients have no secret: send client_id in the body instead of
  // a Basic auth header. Confidential clients authenticate with Basic.
  const headers: HeadersInit = config.clientSecret
    ? tokenRequestHeaders(config)
    : { "Content-Type": "application/x-www-form-urlencoded" };

  if (!config.clientSecret) {
    payload.set("client_id", config.clientId);
  }

  const response = await fetch(`https://${config.domain}/oauth2/token`, {
    body: payload,
    headers,
    method: "POST",
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });

  const tokenPayload = (await response.json()) as TokenEndpointResponse;

  if (!response.ok || !tokenPayload.access_token) {
    const detail =
      tokenPayload.error_description ||
      tokenPayload.error ||
      response.status;
    throw new Error(`Cognito token request failed: ${detail}`);
  }

  return {
    accessToken: tokenPayload.access_token,
    idToken: tokenPayload.id_token,
    refreshToken: tokenPayload.refresh_token,
  };
}

function tokenRequestHeaders(config: {
  clientId: string;
  clientSecret: string;
}): HeadersInit {
  const basic = Buffer.from(
    `${config.clientId}:${config.clientSecret}`,
  ).toString("base64");
  return {
    Authorization: `Basic ${basic}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}
