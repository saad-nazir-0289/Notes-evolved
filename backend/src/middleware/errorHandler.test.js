import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler, notFoundHandler } from "./errorHandler.js";
import asyncHandler from "./asyncHandler.js";

const createResponse = (headersSent = false) => ({
  headersSent,
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("redacts unexpected server errors in the standard failure envelope", () => {
  const response = createResponse();
  const originalError = console.error;
  console.error = () => {};

  try {
    errorHandler(new Error("private database connection details"), {}, response, assert.fail);
  } finally {
    console.error = originalError;
  }

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, {
    success: false,
    message: "Internal server error",
    data: null,
  });
});

test("preserves intentional client errors in the standard failure envelope", () => {
  const response = createResponse();
  const error = Object.assign(new Error("Note not found"), { status: 404 });

  errorHandler(error, {}, response, assert.fail);

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, {
    success: false,
    message: "Note not found",
    data: null,
  });
});

test("maps Mongoose validation and cast errors to 400", () => {
  for (const name of ["ValidationError", "CastError"]) {
    const response = createResponse();
    const error = Object.assign(new Error("Invalid input"), { name });

    errorHandler(error, {}, response, assert.fail);

    assert.equal(response.statusCode, 400);
  }
});

test("maps duplicate-key errors to 409", () => {
  const response = createResponse();
  const error = Object.assign(new Error("duplicate"), { code: 11000 });

  errorHandler(error, {}, response, assert.fail);

  assert.equal(response.statusCode, 409);
});

test("maps oversized and malformed JSON bodies", () => {
  const oversized = createResponse();
  errorHandler(
    Object.assign(new Error("too large"), { type: "entity.too.large" }),
    {},
    oversized,
    assert.fail,
  );
  assert.equal(oversized.statusCode, 413);

  const malformed = createResponse();
  errorHandler(
    Object.assign(new Error("bad json"), { type: "entity.parse.failed" }),
    {},
    malformed,
    assert.fail,
  );
  assert.equal(malformed.statusCode, 400);
});

test("forwards a 404 from the not-found middleware", () => {
  let forwarded;
  notFoundHandler({}, {}, (error) => {
    forwarded = error;
  });

  assert.equal(forwarded.status, 404);
  assert.equal(forwarded.message, "Route not found");
});

test("passes errors through when response headers were already sent", () => {
  const response = createResponse(true);
  const error = new Error("late error");
  let forwarded;

  errorHandler(error, {}, response, (received) => {
    forwarded = received;
  });

  assert.equal(forwarded, error);
  assert.equal(response.statusCode, null);
});

test("forwards rejected async route handlers", async () => {
  const error = new Error("async failure");
  let forwarded;

  await asyncHandler(async () => {
    throw error;
  })({}, {}, (received) => {
    forwarded = received;
  });

  assert.equal(forwarded, error);
});
