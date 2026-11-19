import test from "node:test";
import assert from "node:assert/strict";
import { createNotesController } from "./createNotesController.js";

const note = {
  _id: "507f1f77bcf86cd799439011",
  title: "Project",
  description: "Project details",
  createdAt: "2026-11-09T08:00:00.000Z",
  updatedAt: "2026-11-09T08:00:00.000Z",
};

const createModel = ({ total = 25, results = [note] } = {}) => {
  const calls = {};
  const model = {
    countDocuments: async (filter) => { calls.countFilter = filter; return total; },
    find: (filter) => {
      calls.filter = filter;
      const query = {
        sort(sort) { calls.sort = sort; return query; },
        skip(skip) { calls.skip = skip; return query; },
        limit(limit) { calls.limit = limit; return Promise.resolve(results); },
      };
      return query;
    },
    findById: async (id) => { calls.findById = id; return note; },
    findByIdAndUpdate: async (id, body, options) => { calls.update = { id, body, options }; return { ...note, ...body }; },
    create: async (body) => { calls.create = body; return note; },
    findByIdAndDelete: async (id) => { calls.delete = id; return note; },
  };
  return { model, calls };
};

const invoke = async (handler, req = {}) => {
  const response = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  let error;
  await handler(req, response, (nextError) => { error = nextError; });
  return { response, error };
};

test("list endpoint returns notes and bounded pagination metadata", async () => {
  const { model, calls } = createModel();
  const { response, error } = await invoke(createNotesController(model).getNotes);
  assert.equal(error, undefined);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.data, [note]);
  assert.deepEqual(response.body.meta.pagination, { page: 1, limit: 12, total: 25, totalPages: 3 });
  assert.deepEqual(calls.sort, { createdAt: -1, _id: -1 });
  assert.equal(calls.skip, 0);
  assert.equal(calls.limit, 12);
  assert.deepEqual(calls.countFilter, {});
});

test("list endpoint applies the same search filter to count and page queries", async () => {
  const { model, calls } = createModel({ total: 40 });
  const { response } = await invoke(createNotesController(model).getNotes, {
    noteSearchTerm: "project",
    noteSort: { title: 1, _id: 1 },
    notePagination: { page: 2, limit: 10 },
  });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls.filter, calls.countFilter);
  assert.deepEqual(calls.filter, {
    $or: [
      { title: { $regex: "project", $options: "i" } },
      { description: { $regex: "project", $options: "i" } },
    ],
  });
  assert.deepEqual(calls.sort, { title: 1, _id: 1 });
  assert.equal(calls.skip, 10);
  assert.equal(calls.limit, 10);
  assert.deepEqual(response.body.meta.pagination, { page: 2, limit: 10, total: 40, totalPages: 4 });
});

test("list endpoint clamps pages after the collection shrinks", async () => {
  const { model, calls } = createModel({ total: 13 });
  const { response } = await invoke(createNotesController(model).getNotes, {
    notePagination: { page: 99, limit: 12 },
  });
  assert.equal(calls.skip, 12);
  assert.deepEqual(response.body.meta.pagination, { page: 2, limit: 12, total: 13, totalPages: 2 });
});

test("list endpoint handles empty collections without invalid page numbers", async () => {
  const { model, calls } = createModel({ total: 0, results: [] });
  const { response } = await invoke(createNotesController(model).getNotes, {
    notePagination: { page: 5, limit: 12 },
  });
  assert.deepEqual(response.body.data, []);
  assert.equal(calls.skip, 0);
  assert.deepEqual(response.body.meta.pagination, { page: 1, limit: 12, total: 0, totalPages: 0 });
});

test("single-note endpoint returns the standard success envelope", async () => {
  const { model } = createModel();
  const { response, error } = await invoke(createNotesController(model).getNote, { params: { id: note._id } });
  assert.equal(error, undefined);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.data, note);
});

test("create, update, and delete preserve their response contracts", async () => {
  const { model, calls } = createModel();
  const controllers = createNotesController(model);
  const createBody = { title: "Project", description: "Details" };
  const created = await invoke(controllers.createNote, { body: createBody });
  assert.equal(created.response.statusCode, 201);
  assert.deepEqual(created.response.body, {
    success: true,
    message: "Note created successfully",
    data: note,
  });
  assert.deepEqual(calls.create, createBody);

  const updateBody = { title: "Renamed" };
  const updated = await invoke(controllers.updateNote, { params: { id: note._id }, body: updateBody });
  assert.equal(updated.response.statusCode, 200);
  assert.deepEqual(updated.response.body, {
    success: true,
    message: "Note updated successfully",
    data: { ...note, ...updateBody },
  });
  assert.deepEqual(calls.update.options, { new: true, runValidators: true });

  const deleted = await invoke(controllers.deleteNote, { params: { id: note._id } });
  assert.equal(deleted.response.statusCode, 200);
  assert.deepEqual(deleted.response.body, {
    success: true,
    message: "Note deleted successfully",
    data: null,
  });

});

test("read, update, and delete return not-found errors for missing notes", async () => {
  const { model } = createModel();
  model.findById = async () => null;
  model.findByIdAndUpdate = async () => null;
  model.findByIdAndDelete = async () => null;
  const controllers = createNotesController(model);
  const cases = [
    [controllers.getNote, { params: { id: note._id } }],
    [controllers.updateNote, { params: { id: note._id }, body: { title: "Renamed" } }],
    [controllers.deleteNote, { params: { id: note._id } }],
  ];
  for (const [handler, request] of cases) {
    const { response, error } = await invoke(handler, request);
    assert.equal(response.statusCode, null);
    assert.equal(error.status, 404);
  }
});

test("forwards database failures from list and CRUD operations", async () => {
  const databaseError = new Error("database unavailable");
  const query = { sort() { return query; }, skip() { return query; }, limit: async () => { throw databaseError; } };
  const model = {
    countDocuments: async () => 1,
    find: () => query,
    findById: async () => { throw databaseError; },
    findByIdAndUpdate: async () => { throw databaseError; },
    create: async () => { throw databaseError; },
    findByIdAndDelete: async () => { throw databaseError; },
  };
  const controllers = createNotesController(model);
  const cases = [
    [controllers.getNotes, {}],
    [controllers.getNote, { params: { id: note._id } }],
    [controllers.createNote, { body: { title: note.title, description: note.description } }],
    [controllers.updateNote, { params: { id: note._id }, body: { title: "Renamed" } }],
    [controllers.deleteNote, { params: { id: note._id } }],
  ];
  for (const [handler, request] of cases) {
    const { response, error } = await invoke(handler, request);
    assert.equal(response.statusCode, null);
    assert.equal(error, databaseError);
  }
});
