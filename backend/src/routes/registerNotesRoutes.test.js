import test from "node:test";
import assert from "node:assert/strict";
import { registerNotesRoutes } from "./registerNotesRoutes.js";
import { errorHandler } from "../middleware/errorHandler.js";

const NOTE_ID = "507f1f77bcf86cd799439011";
const createRouter = () => {
  const routes = new Map();
  const router = {};
  for (const method of ["get", "post", "put", "delete"]) {
    router[method] = (path, ...handlers) => { routes.set(`${method.toUpperCase()} ${path}`, handlers); return router; };
  }
  return { router, routes };
};
const dispatch = (routes, method, path, { params = {}, body, query = {} } = {}) => new Promise((resolve, reject) => {
  const handlers = routes.get(`${method} ${path}`);
  assert.ok(handlers, `Expected ${method} ${path} to be registered`);
  const req = { params, body, query };
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
    if (error) { settled = true; errorHandler(error, req, res, reject); return; }
    const handler = handlers[index++];
    if (!handler) return finish({ statusCode: res.statusCode, body: res.body });
    try {
      const result = handler(req, res, next);
      if (result && typeof result.then === "function") result.catch(next);
    } catch (caught) { next(caught); }
  };
  next();
});
const createNoteModel = () => {
  const records = new Map();
  const sortCalls = [];
  const calls = {};
  return {
    records,
    sortCalls,
    calls,
    countDocuments: async (filter) => { calls.countFilter = filter; return records.size; },
    find: (filter) => {
      calls.filter = filter;
      const query = {
        sort(sort) { sortCalls.push(sort); calls.sort = sort; return query; },
        skip(skip) { calls.skip = skip; return query; },
        limit(limit) {
          calls.limit = limit;
          const sorted = [...records.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          return Promise.resolve(sorted.slice(calls.skip, calls.skip + limit));
        },
      };
      return query;
    },
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
    findByIdAndDelete: async (id) => { const note = records.get(id) ?? null; records.delete(id); return note; },
  };
};

test("registered CRUD routes still complete create, read, update, list, and delete", async () => {
  const { router, routes } = createRouter();
  const Note = createNoteModel();
  registerNotesRoutes(router, Note);
  const created = await dispatch(routes, "POST", "/", { body: { title: " First note ", description: " Saved details " } });
  assert.equal(created.statusCode, 201);
  const read = await dispatch(routes, "GET", "/:id", { params: { id: NOTE_ID } });
  assert.equal(read.statusCode, 200);
  const updated = await dispatch(routes, "PUT", "/:id", { params: { id: NOTE_ID }, body: { title: " Renamed note " } });
  assert.equal(updated.body.data.title, "Renamed note");
  const listed = await dispatch(routes, "GET", "/", {});
  assert.equal(listed.statusCode, 200);
  assert.equal(listed.body.data.length, 1);
  assert.deepEqual(listed.body.meta.pagination, { page: 1, limit: 12, total: 1, totalPages: 1 });
  const deleted = await dispatch(routes, "DELETE", "/:id", { params: { id: NOTE_ID } });
  assert.equal(deleted.statusCode, 200);
  const missing = await dispatch(routes, "GET", "/:id", { params: { id: NOTE_ID } });
  assert.equal(missing.statusCode, 404);
  assert.deepEqual(missing.body, { success: false, message: "Note not found", data: null });
});

test("GET / applies bounded pagination after search and sort validation", async () => {
  const { router, routes } = createRouter();
  const Note = createNoteModel();
  registerNotesRoutes(router, Note);
  for (let index = 0; index < 3; index += 1) {
    const id = `507f1f77bcf86cd79943901${index + 1}`;
    Note.records.set(id, { _id: id, title: `Note ${index + 1}`, description: "Project", createdAt: "2026-11-12T05:00:00.000Z" });
  }
  const result = await dispatch(routes, "GET", "/", {
    query: { q: "project", sortBy: "title", sortOrder: "asc", page: "2", limit: "1" },
  });
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.data[0].title, "Note 2");
  assert.deepEqual(result.body.meta.pagination, { page: 2, limit: 1, total: 3, totalPages: 3 });
  assert.deepEqual(Note.calls.filter, Note.calls.countFilter);
  assert.deepEqual(Note.calls.sort, { title: 1, _id: 1 });
  assert.equal(Note.calls.skip, 1);
  assert.equal(Note.calls.limit, 1);
});

test("registered routes reject invalid ids, write fields, and pagination queries", async () => {
  const { router, routes } = createRouter();
  const Note = createNoteModel();
  registerNotesRoutes(router, Note);
  const invalidId = await dispatch(routes, "GET", "/:id", { params: { id: "not-an-object-id" } });
  assert.equal(invalidId.statusCode, 400);
  const invalidBody = await dispatch(routes, "POST", "/", { body: { title: "Valid", description: "Valid", owner: "injected" } });
  assert.equal(invalidBody.statusCode, 400);
  const invalidPage = await dispatch(routes, "GET", "/", { query: { page: "0" } });
  assert.equal(invalidPage.statusCode, 400);
  assert.equal(invalidPage.body.message, "Page must be a positive integer");
  assert.equal(Note.records.size, 0);
});
