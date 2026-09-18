import { CognitoJwtVerifier } from "aws-jwt-verify";
import { readEnv } from "@/lib/dynamodb/env";

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  if (verifier) return verifier;

  const userPoolId = readEnv("COGNITO_USER_POOL_ID");
  const clientId = readEnv("COGNITO_CLIENT_ID");

  if (!userPoolId || !clientId) {
    throw new Error(
      "COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID must be set for Cognito auth",
    );
  }

  verifier = CognitoJwtVerifier.create({
    userPoolId,
    clientId,
    tokenUse: "id", // ID token carries group claims
  });

  return verifier;
}

export type CognitoIdTokenPayload = {
  sub: string;
  email?: string;
  "cognito:username"?: string;
  "cognito:groups"?: string[];
  [key: string]: unknown;
};

/**
 * Verify a Cognito ID token and return its payload.
 * Returns null if verification fails (expired, invalid, etc.).
 */
export async function verifyCognitoToken(
  token: string,
): Promise<CognitoIdTokenPayload | null> {
  try {
    const payload = await getVerifier().verify(token);
    return payload as unknown as CognitoIdTokenPayload;
  } catch {
    return null;
  }
}
