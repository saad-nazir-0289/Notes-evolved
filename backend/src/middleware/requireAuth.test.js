import test from "node:test";
import assert from "node:assert/strict";
import { createRequireAuth } from "./requireAuth.js";
import { signAccessToken } from "../utils/auth.js";

const SECRET = "test-only-secret-that-is-at-least-32-bytes";
const invoke = (handler, req) => new Promise((resolve) => {
  handler(req, {}, (error) => resolve(error));
});

test("bearer authentication resolves the user from the token subject", async () => {
  const User = { findById: async (id) => ({ _id: id, email: "user@example.com" }) };
  const req = { headers: { authorization: `Bearer ${signAccessToken("user-123", SECRET)}` } };
  const error = await invoke(createRequireAuth(User, { jwtSecret: SECRET }), req);

  assert.equal(error, undefined);
  assert.deepEqual(req.user, { id: "user-123", email: "user@example.com" });
});

test("bearer authentication rejects missing tokens and deleted users", async () => {
  const requireAuth = createRequireAuth({ findById: async () => null }, { jwtSecret: SECRET });
  const missing = await invoke(requireAuth, { headers: {} });
  assert.equal(missing.status, 401);

  const deleted = await invoke(requireAuth, {
    headers: { authorization: `Bearer ${signAccessToken("deleted-user", SECRET)}` },
  });
  assert.equal(deleted.status, 401);
});
