import test from "node:test";
import assert from "node:assert/strict";
import { validateAuthCredentials } from "./authValidation.js";

const run = (middleware, body) => new Promise((resolve, reject) => {
  const req = { body };
  middleware(req, {}, (error) => error ? reject(error) : resolve(req));
});

test("registration normalizes email and preserves password whitespace", async () => {
  const req = await run(validateAuthCredentials({ registration: true }), {
    email: "  USER@Example.COM ",
    password: "  a-long-password  ",
  });
  assert.deepEqual(req.authCredentials, {
    email: "user@example.com",
    password: "  a-long-password  ",
  });
});

test("registration rejects short passwords and malformed email addresses", async () => {
  await assert.rejects(
    run(validateAuthCredentials({ registration: true }), { email: "user@example.com", password: "short" }),
    { status: 400 },
  );
  await assert.rejects(
    run(validateAuthCredentials({ registration: true }), { email: "not-an-email", password: "long-enough-password" }),
    { status: 400 },
  );
});

test("authentication validation rejects extra fields and non-object bodies", async () => {
  await assert.rejects(
    run(validateAuthCredentials(), { email: "user@example.com", password: "password", isAdmin: true }),
    /Unsupported authentication field/,
  );
  await assert.rejects(run(validateAuthCredentials(), []), /JSON object/);
});

test("login validation does not apply the registration minimum password length", async () => {
  const req = await run(validateAuthCredentials(), { email: "user@example.com", password: "old" });
  assert.equal(req.authCredentials.password, "old");
});
