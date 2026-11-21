import test from "node:test";
import assert from "node:assert/strict";
import { createAuthController } from "./createAuthController.js";
import { hashPassword, verifyAccessToken } from "../utils/auth.js";

const SECRET = "test-only-secret-that-is-at-least-32-bytes";
const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});
const invoke = async (handler, req) => {
  const res = response();
  let caught;
  await handler(req, res, (error) => { caught = error; });
  return { res, error: caught };
};

test("registration stores only a password hash and returns a signed token", async () => {
  let created;
  const User = {
    exists: async () => null,
    create: async (document) => {
      created = document;
      return { _id: "user-123", email: document.email, passwordHash: document.passwordHash };
    },
  };
  const controller = createAuthController(User, { jwtSecret: SECRET });
  const { res, error } = await invoke(controller.register, {
    authCredentials: { email: "user@example.com", password: "a-long-password" },
  });

  assert.equal(error, undefined);
  assert.equal(res.statusCode, 201);
  assert.equal(created.email, "user@example.com");
  assert.notEqual(created.passwordHash, "a-long-password");
  assert.equal(await verifyAccessToken(res.body.data.token, SECRET) !== null, true);
  assert.deepEqual(res.body.data.user, { id: "user-123", email: "user@example.com" });
  assert.equal(Object.hasOwn(res.body.data.user, "passwordHash"), false);
});

test("login selects the password hash and rejects incorrect credentials generically", async () => {
  const passwordHash = await hashPassword("a-long-password");
  let selected = false;
  const user = { _id: "user-123", email: "user@example.com", passwordHash };
  const User = {
    findOne: () => ({ select: async (field) => { selected = field === "+passwordHash"; return user; } }),
  };
  const controller = createAuthController(User, { jwtSecret: SECRET });
  const success = await invoke(controller.login, {
    authCredentials: { email: user.email, password: "a-long-password" },
  });
  assert.equal(selected, true);
  assert.equal(success.error, undefined);
  assert.equal(success.res.statusCode, 200);

  const invalid = await invoke(controller.login, {
    authCredentials: { email: user.email, password: "wrong-password" },
  });
  assert.equal(invalid.error.status, 401);
  assert.equal(invalid.error.message, "Invalid email or password");
});

test("login performs a password-hash check for unknown email addresses", async () => {
  const User = { findOne: () => ({ select: async () => null }) };
  const controller = createAuthController(User, { jwtSecret: SECRET });
  const result = await invoke(controller.login, {
    authCredentials: { email: "missing@example.com", password: "some-password" },
  });
  assert.equal(result.error.status, 401);
  assert.equal(result.error.message, "Invalid email or password");
});
