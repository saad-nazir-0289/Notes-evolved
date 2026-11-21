import test from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  verifyAccessToken,
} from "./auth.js";
import { getJwtSecret, AUTH_TOKEN_TTL_SECONDS } from "../config/auth.js";

const SECRET = "test-only-secret-that-is-at-least-32-bytes";

test("passwords are salted, hashed, and verified without storing plaintext", async () => {
  const password = "a-long-password-with-enough-entropy";
  const [first, second] = await Promise.all([hashPassword(password), hashPassword(password)]);

  assert.match(first, /^scrypt\$32768\$8\$1\$/);
  assert.notEqual(first, second);
  assert.equal(first.includes(password), false);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("a-different-password", first), false);
  assert.equal(await verifyPassword(password, "not-a-valid-hash"), false);
});

test("access tokens contain the expected issuer, audience, subject, and expiry", () => {
  const now = 1_800_000_000;
  const token = signAccessToken("user-123", SECRET, now);
  const claims = verifyAccessToken(token, SECRET, now + 10);

  assert.equal(claims.sub, "user-123");
  assert.equal(claims.iss, "notes-evolved");
  assert.equal(claims.aud, "notes-evolved-api");
  assert.equal(claims.exp - claims.iat, AUTH_TOKEN_TTL_SECONDS);
});

test("access tokens reject tampering, expiration, and a different signing key", () => {
  const now = 1_800_000_000;
  const token = signAccessToken("user-123", SECRET, now);
  const [header, payload, signature] = token.split(".");
  const changedPayload = Buffer.from(JSON.stringify({ sub: "attacker" })).toString("base64url");

  assert.equal(verifyAccessToken(`${header}.${changedPayload}.${signature}`, SECRET, now), null);
  assert.equal(verifyAccessToken(token, SECRET, now + AUTH_TOKEN_TTL_SECONDS), null);
  assert.equal(verifyAccessToken(token, `${SECRET}-wrong`, now), null);
  assert.equal(verifyAccessToken("not-a-token", SECRET, now), null);
});

test("JWT secrets must contain at least 32 bytes", () => {
  assert.throws(() => getJwtSecret("too-short"), /at least 32 bytes/);
  assert.equal(getJwtSecret(SECRET), SECRET);
});
