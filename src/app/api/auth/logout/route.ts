import { cookies } from "next/headers";

import { readEnv } from "@/lib/dynamodb/env";

export const dynamic = "force-dynamic";

const SESSION_COOKIE = "arcus_session";

/**
 * GET /api/auth/logout
 * Clears the session cookie and optionally redirects to Cognito's logout endpoint.
 */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);

  const origin = new URL(request.url).origin;
  
  // Redirect to the home page
  return Response.redirect(origin, 302);
}
