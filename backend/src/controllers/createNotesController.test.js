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

const createModel = () => {
  const calls = {};
  const model = {
    find: () => ({
      sort: async (sort) => {
        calls.sort = sort;
        return [note];
      },
    }),
    findById: async (id) => {
      calls.findById = id;
      return note;
    },
    findByIdAndUpdate: async (id, body, options) => {
      calls.update = { id, body, options };
      return { ...note, ...body };
    },
    create: async (body) => {
      calls.create = body;
      return note;
    },
    findByIdAndDelete: async (id) => {
      calls.delete = id;
      return note;
    },
  };

  return { model, calls };
};

const invoke = async (handler, req = {}) => {
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
  let error;

  await handler(req, response, (nextError) => {
    error = nextError;
  });

  return { response, error };
};

test("list endpoint returns the standard success envelope", async () => {
  const { model, calls } = createModel();
  const { response, error } = await invoke(createNotesController(model).getNotes);

  assert.equal(error, undefined);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    success: true,
    message: "Notes found successfully",
    data: [note],
  });
  assert.deepEqual(calls.sort, { createdAt: -1 });
});

test("list endpoint returns an empty array when no notes exist", async () => {
  const { model } = createModel();
  model.find = () => ({ sort: async () => [] });
  const { response, error } = await invoke(createNotesController(model).getNotes);

  assert.equal(error, undefined);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.data, []);
});

test("single-note endpoint returns the standard success envelope", async () => {
  const { model } = createModel();
  const { response, error } = await invoke(createNotesController(model).getNote, {
    params: { id: note._id },
  });

  assert.equal(error, undefined);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    success: true,
    message: "Note found successfully",
    data: note,
  });
});

test("create endpoint returns the standard envelope and HTTP 201", async () => {
  const { model, calls } = createModel();
  const body = { title: "Project", description: "Project details" };
  const { response, error } = await invoke(createNotesController(model).createNote, { body });

  assert.equal(error, undefined);
  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.body, {
    success: true,
    message: "Note created successfully",
    data: note,
  });
  assert.deepEqual(calls.create, body);
});

test("update endpoint returns the standard envelope and keeps validators enabled", async () => {
  const { model, calls } = createModel();
  const body = { title: "Renamed" };
  const { response, error } = await invoke(createNotesController(model).updateNote, {
    params: { id: note._id },
    body,
  });

  assert.equal(error, undefined);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    success: true,
    message: "Note updated successfully",
    data: { ...note, ...body },
  });
  assert.deepEqual(calls.update, {
    id: note._id,
    body,
    options: { new: true, runValidators: true },
  });
});

test("delete endpoint returns the standard envelope with null data", async () => {
  const { model, calls } = createModel();
  const { response, error } = await invoke(createNotesController(model).deleteNote, {
    params: { id: note._id },
  });

  assert.equal(error, undefined);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    success: true,
    message: "Note deleted successfully",
    data: null,
  });
  assert.equal(calls.delete, note._id);
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
    assert.equal(error.message, "Note not found");
  }
});

test("forwards database failures from every CRUD operation", async () => {
  const databaseError = new Error("database unavailable");
  const model = {
    find: () => ({ sort: async () => { throw databaseError; } }),
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
