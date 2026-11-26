import test from "node:test";
import assert from "node:assert/strict";
import { createNoteSort, DEFAULT_NOTE_SORT, NOTE_SORT_FIELDS } from "./noteSorting.js";
import { validateNoteSortQuery } from "../middleware/noteValidation.js";

const invoke = (query) => new Promise((resolve, reject) => {
  const req = { query };
  validateNoteSortQuery(req, {}, (error) => (error ? reject(error) : resolve(req)));
});

test("defaults to newest notes first with a deterministic tie-breaker", async () => {
  const req = await invoke({});
  assert.deepEqual(req.noteSort, { isPinned: -1, createdAt: -1, _id: -1 });
  assert.deepEqual(DEFAULT_NOTE_SORT, { sortBy: "createdAt", sortOrder: "desc" });
});

test("accepts each allowlisted field and both directions", async () => {
  for (const field of NOTE_SORT_FIELDS) {
    const ascending = await invoke({ sortBy: field, sortOrder: "asc" });
    const descending = await invoke({ sortBy: field, sortOrder: "desc" });
    assert.deepEqual(ascending.noteSort, { isPinned: -1, [field]: 1, _id: 1 });
    assert.deepEqual(descending.noteSort, { isPinned: -1, [field]: -1, _id: -1 });
  }
});

test("rejects unknown, empty, and non-string sort fields", async () => {
  for (const sortBy of ["", "__proto__", "password", ["title"], { $gt: "" }]) {
    await assert.rejects(invoke({ sortBy }), {
      status: 400,
      message: "Sort field must be one of: createdAt, updatedAt, title",
    });
  }
});

test("rejects unknown and non-string sort directions", async () => {
  for (const sortOrder of ["ascending", "1", ["asc"], { $gt: "" }]) {
    await assert.rejects(invoke({ sortOrder }), {
      status: 400,
      message: "Sort order must be either asc or desc",
    });
  }
});

test("allows either option to use its default independently", async () => {
  const req = await invoke({ sortBy: "title" });
  assert.deepEqual(req.noteSort, { title: -1, _id: -1 });
});

test("sort construction never uses an untrusted field name", () => {
  assert.deepEqual(createNoteSort("__proto__", "asc"), { isPinned: -1, createdAt: 1, _id: 1 });
});
