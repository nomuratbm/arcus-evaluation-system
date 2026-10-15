import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { beforeEach, afterEach, test } from "node:test";
import {
  createPkce, exchangeAuthorizationCode, getAuthorizeUrl,
  refreshAccessToken, revokeRefreshToken, safeReturnPath,
} from "@/lib/auth/cognito";
import { ACCESS_COOKIE, REFRESH_COOKIE, OAUTH_STATE_COOKIE } from "@/lib/auth/cookie-names";

const configuration = {
  APP_BASE_URL: "http://localhost:3100",
  COGNITO_DOMAIN: "auth.example.invalid",
  COGNITO_CLIENT_ID: "test-client",
  COGNITO_USER_POOL_ID: "ap-southeast-1_test",
  COGNITO_CLIENT_SECRET: "",
};
let previous: Record<string, string | undefined>;
beforeEach(() => {
  previous = Object.fromEntries(Object.keys(configuration).map((key) => [key, process.env[key]]));
  Object.assign(process.env, configuration);
});
afterEach(() => {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("login preserves event query attribution and rejects unsafe return targets", () => {
  const path = "/forms?eventId=event-1&eventTitle=Workshop";
  assert.equal(safeReturnPath(path), path);
  for (const value of [null, "https://evil.invalid", "//evil.invalid", "/\\evil.invalid", "/api/auth/logout", "/unknown"]) {
    assert.equal(safeReturnPath(value), "/");
  }
});

test("evaluation cookies do not overwrite attendance cookies on the same host", () => {
  assert.notEqual(ACCESS_COOKIE, "cognito_access");
  assert.notEqual(REFRESH_COOKIE, "cognito_refresh");
  assert.notEqual(OAUTH_STATE_COOKIE, "cognito_oauth_state");
});

test("authorization uses random S256 PKCE, state, and nonce", () => {
  const pkce = createPkce();
  assert.match(pkce.verifier, /^[A-Za-z0-9_-]{43,128}$/);
  assert.equal(pkce.challenge, createHash("sha256").update(pkce.verifier).digest("base64url"));
  assert.notEqual(pkce.verifier, createPkce().verifier);
  const url = new URL(getAuthorizeUrl({ challenge: pkce.challenge, state: "state", nonce: "nonce" }));
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("state"), "state");
  assert.equal(url.searchParams.get("nonce"), "nonce");
  assert.equal(url.searchParams.get("redirect_uri"), "http://localhost:3100/api/auth/callback");
});

test("public-client code exchange sends verifier and no client secret", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    assert.equal(url, "https://auth.example.invalid/oauth2/token");
    const body = options.body as URLSearchParams;
    assert.equal(body.get("grant_type"), "authorization_code");
    assert.equal(body.get("code"), "code");
    assert.equal(body.get("code_verifier"), "verifier");
    assert.equal(body.get("client_id"), "test-client");
    assert.equal(new Headers(options.headers).has("Authorization"), false);
    assert.ok(options.signal);
    assert.equal(options.cache, "no-store");
    return Response.json({ access_token: "access", id_token: "id", refresh_token: "refresh" });
  });
  assert.deepEqual(await exchangeAuthorizationCode("code", "verifier"), {
    accessToken: "access", idToken: "id", refreshToken: "refresh",
  });
});

test("confidential-client exchange authenticates on the server", async (t) => {
  process.env.COGNITO_CLIENT_SECRET = "test-secret";
  t.mock.method(globalThis, "fetch", async (_url: string, options: RequestInit) => {
    assert.equal(new Headers(options.headers).get("Authorization"), `Basic ${Buffer.from("test-client:test-secret").toString("base64")}`);
    return Response.json({ access_token: "access" });
  });
  assert.equal((await exchangeAuthorizationCode("code", "verifier")).accessToken, "access");
});

for (const replacement of [undefined, "rotated"]) {
  test(`refresh ${replacement ? "retains rotated" : "preserves existing"} refresh token`, async (t) => {
    t.mock.method(globalThis, "fetch", async (_url: string, options: RequestInit) => {
      assert.equal((options.body as URLSearchParams).get("refresh_token"), "original");
      return Response.json({ access_token: "fresh", refresh_token: replacement });
    });
    assert.equal((await refreshAccessToken("original")).refreshToken, replacement ?? "original");
  });
}

test("token failures are rejected instead of creating a session", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ error: "invalid_grant" }, { status: 400 }));
  await assert.rejects(exchangeAuthorizationCode("bad", "verifier"), /invalid_grant/);
});

test("logout revocation sends the refresh token to the configured provider", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    assert.equal(url, "https://auth.example.invalid/oauth2/revoke");
    assert.equal((options.body as URLSearchParams).get("token"), "refresh");
    return new Response(null, { status: 200 });
  });
  await revokeRefreshToken("refresh");
  assert.equal(fetch.mock.callCount(), 1);
});
