import test from "node:test";
import assert from "node:assert/strict";
import { registerNotesRoutes } from "./registerNotesRoutes.js";
import { errorHandler } from "../middleware/errorHandler.js";

const NOTE_ID = "507f1f77bcf86cd799439011";

const createRouter = () => {
  const routes = new Map();
  const router = {};
  for (const method of ["get", "post", "put", "delete"]) {
    router[method] = (path, ...handlers) => {
      routes.set(`${method.toUpperCase()} ${path}`, handlers);
      return router;
    };
  }
  return { router, routes };
};

const dispatch = (routes, method, path, { params = {}, body } = {}) => new Promise((resolve, reject) => {
  const handlers = routes.get(`${method} ${path}`);
  assert.ok(handlers, `Expected ${method} ${path} to be registered`);

  const req = { params, body };
  const res = {
    statusCode: 200,
    body: null,
    headersSent: false,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; resolve({ statusCode: this.statusCode, body: payload }); return this; },
  };
  let index = 0;
  let settled = false;
  const finish = (result) => { if (!settled) { settled = true; resolve(result); } };
  const next = (error) => {
    if (settled) return;
    if (error) {
      settled = true;
      errorHandler(error, req, res, reject);
      return;
    }
    const handler = handlers[index++];
    if (!handler) return finish({ statusCode: res.statusCode, body: res.body });
    try {
      const result = handler(req, res, next);
      if (result && typeof result.then === "function") result.catch(next);
    } catch (error) {
      next(error);
    }
  };
  next();
});

const createNoteModel = () => {
  const records = new Map();
  return {
    records,
    find: () => ({ sort: async () => [...records.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }),
    findById: async (id) => records.get(id) ?? null,
    create: async (body) => {
      const now = "2026-11-12T05:00:00.000Z";
      const note = { _id: NOTE_ID, ...body, createdAt: now, updatedAt: now };
      records.set(NOTE_ID, note);
      return note;
    },
    findByIdAndUpdate: async (id, body, options) => {
      assert.deepEqual(options, { new: true, runValidators: true });
      const current = records.get(id);
      if (!current) return null;
      const note = { ...current, ...body, updatedAt: "2026-11-12T05:01:00.000Z" };
      records.set(id, note);
      return note;
    },
    findByIdAndDelete: async (id) => {
      const note = records.get(id) ?? null;
      records.delete(id);
      return note;
    },
  };
};

test("registered CRUD route stacks complete create, read, update, list, and delete", async () => {
  const { router, routes } = createRouter();
  const Note = createNoteModel();
  registerNotesRoutes(router, Note);

  assert.deepEqual([...routes.keys()], ["GET /", "GET /:id", "PUT /:id", "POST /", "DELETE /:id"]);

  const created = await dispatch(routes, "POST", "/", {
    body: { title: "  First note  ", description: "  Saved details  " },
  });
  assert.equal(created.statusCode, 201);
  assert.equal(created.body.success, true);
  assert.equal(created.body.data.title, "First note");
  assert.equal(created.body.data.description, "Saved details");

  const read = await dispatch(routes, "GET", "/:id", { params: { id: NOTE_ID } });
  assert.equal(read.statusCode, 200);
  assert.equal(read.body.data._id, NOTE_ID);

  const updated = await dispatch(routes, "PUT", "/:id", {
    params: { id: NOTE_ID },
    body: { title: "  Renamed note  " },
  });
  assert.equal(updated.statusCode, 200);
  assert.equal(updated.body.data.title, "Renamed note");
  assert.equal(updated.body.data.description, "Saved details");

  const listed = await dispatch(routes, "GET", "/", {});
  assert.equal(listed.statusCode, 200);
  assert.equal(listed.body.data.length, 1);
  assert.equal(listed.body.data[0].title, "Renamed note");

  const deleted = await dispatch(routes, "DELETE", "/:id", { params: { id: NOTE_ID } });
  assert.equal(deleted.statusCode, 200);
  assert.deepEqual(deleted.body, {
    success: true,
    message: "Note deleted successfully",
    data: null,
  });

  const missing = await dispatch(routes, "GET", "/:id", { params: { id: NOTE_ID } });
  assert.equal(missing.statusCode, 404);
  assert.deepEqual(missing.body, {
    success: false,
    message: "Note not found",
    data: null,
  });
});

test("registered routes reject invalid ids and unsupported write fields", async () => {
  const { router, routes } = createRouter();
  const Note = createNoteModel();
  registerNotesRoutes(router, Note);

  const invalidId = await dispatch(routes, "GET", "/:id", { params: { id: "not-an-object-id" } });
  assert.equal(invalidId.statusCode, 400);
  assert.equal(invalidId.body.message, "Invalid note id");

  const invalidBody = await dispatch(routes, "POST", "/", {
    body: { title: "Valid", description: "Valid", owner: "injected" },
  });
  assert.equal(invalidBody.statusCode, 400);
  assert.equal(invalidBody.body.success, false);
  assert.equal(Note.records.size, 0);
});
