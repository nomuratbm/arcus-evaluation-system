import { readEnv } from "@/lib/dynamodb/env";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/login
 * Redirects the user to the Cognito Hosted UI for authentication.
 */
export async function GET(request: Request) {
  const rawDomain = readEnv("COGNITO_DOMAIN");
  const domain = rawDomain ? rawDomain.replace(/^https?:\/\//, "") : undefined;
  const clientId = readEnv("COGNITO_CLIENT_ID");

  if (!domain || !clientId) {
    return new Response(
      `<html>
        <head><title>Auth Error</title></head>
        <body style="font-family: sans-serif; padding: 2rem;">
          <h2>Cognito is not configured</h2>
          <p>You clicked Login, but the Cognito environment variables are not set.</p>
          <p>To test the admin side locally without Cognito, set <code>AUTH_DEV_ROLE="admin"</code> in your <code>.env</code> file and restart the dev server. The stub auth will automatically log you in.</p>
          <p><a href="/">Go back</a></p>
        </body>
      </html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "openid",
    redirect_uri: redirectUri,
  });

  const authorizeUrl = `https://${domain}/oauth2/authorize?${params}`;
  return Response.redirect(authorizeUrl, 302);
}
