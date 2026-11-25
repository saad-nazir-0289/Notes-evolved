import test from "node:test";
import assert from "node:assert/strict";
import { registerNotesRoutes } from "./registerNotesRoutes.js";
import { errorHandler } from "../middleware/errorHandler.js";
import { signAccessToken } from "../utils/auth.js";

const NOTE_ID = "507f1f77bcf86cd799439011";
const USER_ID = "user-123";
const OTHER_USER_ID = "user-456";
const SECRET = "test-only-secret-that-is-at-least-32-bytes";
const TOKEN = signAccessToken(USER_ID, SECRET);
const OTHER_TOKEN = signAccessToken(OTHER_USER_ID, SECRET);
const User = { findById: async (id) => ({ _id: id, email: id + "@example.com" }) };
const authOptions = { User, jwtSecret: SECRET };

const createRouter = () => {
  const routes = new Map();
  const router = {};
  for (const method of ["get", "post", "put", "delete"]) {
    router[method] = (path, ...handlers) => { routes.set(method.toUpperCase() + " " + path, handlers); return router; };
  }
  return { router, routes };
};

const dispatch = (routes, method, path, { params = {}, body, query = {}, headers = { authorization: "Bearer " + TOKEN } } = {}) => new Promise((resolve, reject) => {
  const handlers = routes.get(method + " " + path);
  assert.ok(handlers, "Expected " + method + " " + path + " to be registered");
  const req = { params, body, query, headers };
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

const matchesFilter = (record, filter) => {
  if (!record || String(record.owner ?? "") !== String(filter.owner)) return false;
  if (!filter.$or) return true;
  return filter.$or.some((condition) => Object.entries(condition).some(([field, match]) => (
    new RegExp(match.$regex, match.$options).test(record[field] ?? "")
  )));
};

const createNoteModel = () => {
  const records = new Map();
  const calls = {};
  return {
    records,
    calls,
    countDocuments: async (filter) => {
      calls.countFilter = filter;
      return [...records.values()].filter((record) => matchesFilter(record, filter)).length;
    },
    find: (filter) => {
      calls.filter = filter;
      const query = {
        sort(sort) { calls.sort = sort; return query; },
        skip(skip) { calls.skip = skip; return query; },
        limit(limit) {
          calls.limit = limit;
          const [field, direction] = Object.entries(calls.sort ?? { createdAt: -1 }).find(([key]) => key !== "_id") ?? ["createdAt", -1];
          const sorted = [...records.values()].filter((record) => matchesFilter(record, filter))
            .sort((a, b) => String(a[field] ?? "").localeCompare(String(b[field] ?? "")) * direction);
          return Promise.resolve(sorted.slice(calls.skip, calls.skip + limit));
        },
      };
      return query;
    },
    findOne: async (filter) => {
      calls.findOne = filter;
      const record = records.get(filter._id);
      return matchesFilter(record, filter) ? record : null;
    },
    create: async (body) => {
      const now = "2026-11-12T05:00:00.000Z";
      const note = { _id: NOTE_ID, ...body, createdAt: now, updatedAt: now };
      records.set(NOTE_ID, note);
      return note;
    },
    findOneAndUpdate: async (filter, body, options) => {
      calls.update = { filter, body, options };
      const current = records.get(filter._id);
      if (!matchesFilter(current, filter)) return null;
      const note = { ...current, ...body, updatedAt: "2026-11-12T05:01:00.000Z" };
      records.set(filter._id, note);
      return note;
    },
    findOneAndDelete: async (filter) => {
      calls.delete = filter;
      const current = records.get(filter._id);
      if (!matchesFilter(current, filter)) return null;
      records.delete(filter._id);
      return current;
    },
  };
};

test("registered CRUD routes create, read, update, list, and delete only the authenticated user's notes", async () => {
  const { router, routes } = createRouter();
  const Note = createNoteModel();
  registerNotesRoutes(router, Note, authOptions);
  const created = await dispatch(routes, "POST", "/", { body: { title: " First note ", description: " Saved details " } });
  assert.equal(created.statusCode, 201);
  assert.equal(created.body.data.owner, USER_ID);
  const read = await dispatch(routes, "GET", "/:id", { params: { id: NOTE_ID } });
  assert.equal(read.statusCode, 200);
  const updated = await dispatch(routes, "PUT", "/:id", { params: { id: NOTE_ID }, body: { title: " Renamed note " } });
  assert.equal(updated.body.data.title, "Renamed note");
  const listed = await dispatch(routes, "GET", "/", {});
  assert.equal(listed.body.data.length, 1);
  assert.equal(listed.body.meta.pagination.total, 1);
  const deleted = await dispatch(routes, "DELETE", "/:id", { params: { id: NOTE_ID } });
  assert.equal(deleted.statusCode, 200);
  const missing = await dispatch(routes, "GET", "/:id", { params: { id: NOTE_ID } });
  assert.equal(missing.statusCode, 404);
});

test("list and count combine owner scope with search, sort, and pagination", async () => {
  const { router, routes } = createRouter();
  const Note = createNoteModel();
  registerNotesRoutes(router, Note, authOptions);
  Note.records.set(NOTE_ID, { _id: NOTE_ID, owner: USER_ID, title: "Alpha", description: "Project" });
  Note.records.set("507f1f77bcf86cd799439012", { _id: "507f1f77bcf86cd799439012", owner: USER_ID, title: "Beta", description: "Project" });
  Note.records.set("507f1f77bcf86cd799439013", { _id: "507f1f77bcf86cd799439013", owner: OTHER_USER_ID, title: "Other Alpha", description: "Project" });
  const result = await dispatch(routes, "GET", "/", { query: { q: "project", sortBy: "title", sortOrder: "asc", page: "1", limit: "1" } });
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.data.length, 1);
  assert.equal(result.body.data[0].title, "Alpha");
  assert.equal(result.body.meta.pagination.total, 2);
  assert.equal(Note.calls.countFilter.owner, USER_ID);
  assert.deepEqual(Note.calls.filter, Note.calls.countFilter);
  assert.deepEqual(Note.calls.sort, { title: 1, _id: 1 });
});

test("another authenticated user cannot read, update, or delete a note", async () => {
  const { router, routes } = createRouter();
  const Note = createNoteModel();
  registerNotesRoutes(router, Note, authOptions);
  const original = { _id: NOTE_ID, owner: USER_ID, title: "Private", description: "Owner only" };
  Note.records.set(NOTE_ID, original);
  const headers = { authorization: "Bearer " + OTHER_TOKEN };
  const list = await dispatch(routes, "GET", "/", { headers });
  assert.deepEqual(list.body.data, []);
  assert.equal(list.body.meta.pagination.total, 0);
  const read = await dispatch(routes, "GET", "/:id", { params: { id: NOTE_ID }, headers });
  assert.equal(read.statusCode, 404);
  const update = await dispatch(routes, "PUT", "/:id", { params: { id: NOTE_ID }, body: { title: "Stolen" }, headers });
  assert.equal(update.statusCode, 404);
  const remove = await dispatch(routes, "DELETE", "/:id", { params: { id: NOTE_ID }, headers });
  assert.equal(remove.statusCode, 404);
  assert.deepEqual(Note.records.get(NOTE_ID), original);
});

test("ownerless legacy notes are invisible until migrated", async () => {
  const { router, routes } = createRouter();
  const Note = createNoteModel();
  registerNotesRoutes(router, Note, authOptions);
  Note.records.set(NOTE_ID, { _id: NOTE_ID, title: "Legacy", description: "No owner" });
  const list = await dispatch(routes, "GET", "/", {});
  assert.deepEqual(list.body.data, []);
  assert.equal(list.body.meta.pagination.total, 0);
  const read = await dispatch(routes, "GET", "/:id", { params: { id: NOTE_ID } });
  assert.equal(read.statusCode, 404);
});

test("routes reject owner injection, invalid pagination, and missing bearer tokens", async () => {
  const { router, routes } = createRouter();
  const Note = createNoteModel();
  registerNotesRoutes(router, Note, authOptions);
  const invalidBody = await dispatch(routes, "POST", "/", { body: { title: "Valid", description: "Valid", owner: "injected" } });
  assert.equal(invalidBody.statusCode, 400);
  const invalidPage = await dispatch(routes, "GET", "/", { query: { page: "0" } });
  assert.equal(invalidPage.statusCode, 400);
  const missingToken = await dispatch(routes, "POST", "/", { body: null, headers: {} });
  assert.equal(missingToken.statusCode, 401);
  assert.equal(Note.records.size, 0);
  assert.equal(Note.calls.filter, undefined);
});
