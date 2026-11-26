import test from "node:test";
import assert from "node:assert/strict";
import { createNotesController } from "./createNotesController.js";
import { validateNoteBody } from "../middleware/noteValidation.js";
import { createNoteSort } from "../utils/noteSorting.js";

const OWNER_ID = "507f1f77bcf86cd799439011";
const NOTE_ID = "507f1f77bcf86cd799439012";

const invokeMiddleware = (middleware, body) => new Promise((resolve, reject) => {
  const req = { body };
  middleware(req, {}, (error) => (error ? reject(error) : resolve(req.body)));
});

const createController = () => {
  const calls = {};
  const note = { _id: NOTE_ID, owner: OWNER_ID, title: "Project", description: "Details", isPinned: false };
  const Note = {
    findOneAndUpdate: async (filter, update, options) => {
      calls.update = { filter, update, options };
      return { ...note, ...update };
    },
  };
  return { controller: createNotesController(Note), calls };
};

const invokeController = async (handler, { body, user = { id: OWNER_ID } } = {}) => {
  const response = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
  let error;
  await handler({ user, params: { id: NOTE_ID }, body }, response, (nextError) => { error = nextError; });
  return { response, error };
};

test("partial note updates accept both pin and unpin boolean values", async () => {
  assert.deepEqual(await invokeMiddleware(validateNoteBody({ partial: true }), { isPinned: true }), { isPinned: true });
  assert.deepEqual(await invokeMiddleware(validateNoteBody({ partial: true }), { isPinned: false }), { isPinned: false });
});

test("pin updates reject non-boolean values and cannot be injected at creation", async () => {
  await assert.rejects(invokeMiddleware(validateNoteBody({ partial: true }), { isPinned: "true" }), {
    status: 400,
    message: "isPinned must be a boolean",
  });
  await assert.rejects(invokeMiddleware(validateNoteBody(), { title: "Project", description: "Details", isPinned: true }), {
    status: 400,
    message: "Unsupported note field: isPinned",
  });
});

test("pin and unpin updates remain scoped to the authenticated owner", async () => {
  const { controller, calls } = createController();
  for (const isPinned of [true, false]) {
    const { response, error } = await invokeController(controller.updateNote, { body: { isPinned } });
    assert.equal(error, undefined);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.data.isPinned, isPinned);
    assert.deepEqual(calls.update, {
      filter: { _id: NOTE_ID, owner: OWNER_ID },
      update: { isPinned },
      options: { new: true, runValidators: true },
    });
  }
});

test("pin updates fail closed without an authenticated owner", async () => {
  const { controller, calls } = createController();
  const { response, error } = await invokeController(controller.updateNote, {
    body: { isPinned: true },
    user: null,
  });
  assert.equal(response.statusCode, null);
  assert.equal(error.status, 401);
  assert.deepEqual(calls, {});
});

test("pinned notes sort before unpinned notes for every selected sort", () => {
  assert.deepEqual(createNoteSort(), { isPinned: -1, createdAt: -1, _id: -1 });
  assert.deepEqual(createNoteSort("title", "asc"), { isPinned: -1, title: 1, _id: 1 });
  assert.deepEqual(createNoteSort("updatedAt", "desc"), { isPinned: -1, updatedAt: -1, _id: -1 });
});
