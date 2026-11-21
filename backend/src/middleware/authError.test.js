import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "./errorHandler.js";

test("duplicate-key errors do not expose MongoDB index details", () => {
  const response = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };

  errorHandler(Object.assign(new Error("MongoDB collection and key details"), { code: 11000 }), {}, response, assert.fail);

  assert.equal(response.statusCode, 409);
  assert.equal(response.body.message, "An account with this email already exists");
});
