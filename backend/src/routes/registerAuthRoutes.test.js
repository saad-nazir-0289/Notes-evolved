import test from "node:test";
import assert from "node:assert/strict";
import { registerAuthRoutes } from "./registerAuthRoutes.js";

const SECRET = "test-only-secret-that-is-at-least-32-bytes";

test("registers rate-limited register/login routes and a protected current-user route", () => {
  const routes = new Map();
  const router = {
    post(path, ...handlers) { routes.set(`POST ${path}`, handlers); return this; },
    get(path, ...handlers) { routes.set(`GET ${path}`, handlers); return this; },
  };
  const rateLimiter = () => {};
  const User = {};

  registerAuthRoutes(router, User, { jwtSecret: SECRET, rateLimiter });

  assert.equal(routes.get("POST /register").length, 3);
  assert.equal(routes.get("POST /register")[0], rateLimiter);
  assert.equal(routes.get("POST /login").length, 3);
  assert.equal(routes.get("POST /login")[0], rateLimiter);
  assert.equal(routes.get("GET /me").length, 2);
});
