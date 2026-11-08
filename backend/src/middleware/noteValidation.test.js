import test from "node:test";
import assert from "node:assert/strict";
import { validateNoteBody, validateNoteId } from "./noteValidation.js";
import { errorHandler } from "./errorHandler.js";

const invoke = (middleware, req) => new Promise((resolve, reject) => {
  middleware(req, {}, (error) => (error ? reject(error) : resolve(req)));
});

const validateBody = (body, partial = false) =>
  invoke(validateNoteBody({ partial }), { body });

const validateId = (id) => invoke(validateNoteId, { params: { id } });

test("accepts a complete note and trims both fields", async () => {
  const req = await validateBody({ title: "  Project  ", description: "  Details  " });
  assert.deepEqual(req.body, { title: "Project", description: "Details" });
});

test("rejects a missing, primitive, or array body", async () => {
  for (const body of [undefined, null, "note", 42, [], false]) {
    await assert.rejects(validateBody(body), { status: 400, message: "Request body must be a JSON object" });
  }
});

test("requires both fields when creating a note", async () => {
  await assert.rejects(validateBody({ title: "Only title" }), { status: 400, message: "description is required" });
  await assert.rejects(validateBody({ description: "Only description" }), { status: 400, message: "title is required" });
});

test("rejects empty objects and empty strings", async () => {
  await assert.rejects(validateBody({}), { status: 400, message: "At least one note field is required" });
  await assert.rejects(validateBody({ title: " ", description: "Valid" }), { status: 400, message: "title cannot be empty" });
  await assert.rejects(validateBody({ title: "Valid", description: "\n  " }), { status: 400, message: "description cannot be empty" });
});

test("rejects non-string note fields", async () => {
  await assert.rejects(validateBody({ title: 12, description: "Valid" }), { status: 400, message: "title must be a string" });
  await assert.rejects(validateBody({ title: "Valid", description: { text: "no" } }), { status: 400, message: "description must be a string" });
});

test("enforces title and description length limits", async () => {
  await assert.rejects(validateBody({ title: "t".repeat(121), description: "Valid" }), { status: 400, message: "title must be 120 characters or fewer" });
  await assert.rejects(validateBody({ title: "Valid", description: "d".repeat(50001) }), { status: 400, message: "description must be 50000 characters or fewer" });
});

test("accepts values at both maximum lengths", async () => {
  const req = await validateBody({ title: "t".repeat(120), description: "d".repeat(50000) });
  assert.equal(req.body.title.length, 120);
  assert.equal(req.body.description.length, 50000);
});

test("rejects unsupported fields instead of passing them to MongoDB", async () => {
  await assert.rejects(validateBody({ title: "Valid", description: "Valid", owner: "someone-else" }), { status: 400, message: "Unsupported note field: owner" });
  await assert.rejects(validateBody({ title: "Valid", description: "Valid", _id: "injected" }), { status: 400, message: "Unsupported note field: _id" });
});

test("allows a valid partial update", async () => {
  const req = await validateBody({ title: "  Renamed  " }, true);
  assert.deepEqual(req.body, { title: "Renamed" });
});

test("rejects empty partial updates", async () => {
  await assert.rejects(validateBody({}, true), { status: 400, message: "At least one note field is required" });
});

test("accepts valid Mongo ObjectId route parameters", async () => {
  const id = "507f1f77bcf86cd799439011";
  const req = await validateId(id);
  assert.equal(req.params.id, id);
});

test("rejects malformed Mongo ObjectId route parameters", async () => {
  for (const id of [undefined, "", "123", "507f1f77bcf86cd79943901z", "507f1f77bcf86cd799439011extra"]) {
    await assert.rejects(validateId(id), { status: 400, message: "Invalid note id" });
  }
});

test("validation errors are returned as safe HTTP 400 responses", async () => {
  let forwarded;
  await validateNoteBody()({ body: { title: "Only title" } }, {}, (error) => {
    forwarded = error;
  });

  const response = {
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
  };

  errorHandler(forwarded, {}, response, assert.fail);
  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { message: "description is required" });
});
