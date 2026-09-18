import { cookies } from "next/headers";

import { readEnv } from "@/lib/dynamodb/env";
import { verifyCognitoToken } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

const SESSION_COOKIE = "arcus_session";

/**
 * GET /api/auth/callback
 * Cognito redirects here after authentication.
 * Exchanges the authorization code for tokens, verifies the ID token,
 * checks admin group membership, and sets a session cookie.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    console.error("Cognito auth error:", error);
    return Response.redirect(new URL("/?auth=error", url.origin), 302);
  }

  if (!code) {
    return Response.redirect(new URL("/?auth=error", url.origin), 302);
  }

  const rawDomain = readEnv("COGNITO_DOMAIN");
  const domain = rawDomain ? rawDomain.replace(/^https?:\/\//, "") : undefined;
  const clientId = readEnv("COGNITO_CLIENT_ID");
  const clientSecret = readEnv("COGNITO_CLIENT_SECRET");

  if (!domain || !clientId) {
    return Response.json(
      { error: "Cognito is not configured" },
      { status: 500 },
    );
  }

  const redirectUri = `${url.origin}/api/auth/callback`;

  // Exchange authorization code for tokens
  const tokenUrl = `https://${domain}/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  // If a client secret is configured, use Basic auth, and remove client_id from body.
  if (clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );
    headers["Authorization"] = `Basic ${credentials}`;
    body.delete("client_id");
  }

  let tokenData: {
    id_token?: string;
    access_token?: string;
    refresh_token?: string;
    error?: string;
  };

  try {
    const result = await new Promise<{ ok: boolean; data: any }>(
      (resolve, reject) => {
        const https = require("https");
        const req = https.request(
          tokenUrl,
          {
            method: "POST",
            headers,
          },
          (res: any) => {
            let data = "";
            res.on("data", (chunk: string) => {
              data += chunk;
            });
            res.on("end", () => {
              try {
                resolve({
                  ok: res.statusCode && res.statusCode >= 200 && res.statusCode < 300,
                  data: JSON.parse(data),
                });
              } catch (e) {
                reject(e);
              }
            });
          },
        );
        req.on("error", reject);
        req.write(body.toString());
        req.end();
      },
    );

    tokenData = result.data;

    if (!result.ok || tokenData.error) {
      console.error("Token exchange failed:", tokenData);
      return Response.redirect(new URL("/?auth=error", url.origin), 302);
    }
  } catch (err) {
    console.error("Token exchange error:", err);
    return Response.redirect(new URL("/?auth=error", url.origin), 302);
  }

  const idToken = tokenData.id_token;
  if (!idToken) {
    console.error("No ID token in response");
    return Response.redirect(new URL("/?auth=error", url.origin), 302);
  }

  // Verify the ID token
  const payload = await verifyCognitoToken(idToken);
  if (!payload) {
    console.error("ID token verification failed");
    return Response.redirect(new URL("/?auth=error", url.origin), 302);
  }

  // Check admin group membership
  const adminGroup = readEnv("COGNITO_ADMIN_GROUP") || "admin";
  const groups: string[] = payload["cognito:groups"] ?? [];
  if (!groups.includes(adminGroup)) {
    return Response.redirect(new URL("/?auth=forbidden", url.origin), 302);
  }

  // Set the session cookie with the ID token
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Cognito tokens typically expire in 1 hour
    maxAge: 60 * 60,
  });

  return Response.redirect(new URL("/officer", url.origin), 302);
}
