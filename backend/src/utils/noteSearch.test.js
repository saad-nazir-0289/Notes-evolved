import test from "node:test";
import assert from "node:assert/strict";
import { createNoteSearchFilter } from "./noteSearch.js";
import { validateNoteId, validateNoteSearchQuery } from "../middleware/noteValidation.js";
import { registerNotesRoutes } from "../routes/registerNotesRoutes.js";
import { errorHandler } from "../middleware/errorHandler.js";

const invoke = (query) => new Promise((resolve, reject) => {
  const req = { query };
  validateNoteSearchQuery(req, {}, (error) => (error ? reject(error) : resolve(req)));
});

const createRouter = () => {
  const routes = new Map();
  const router = {};
  for (const method of ["get", "post", "put", "delete"]) {
    router[method] = (path, ...handlers) => {
      routes.set(method.toUpperCase() + " " + path, handlers);
      return router;
    };
  }
  return { router, routes };
};

const dispatch = (routes, method, path, { query = {} } = {}) => new Promise((resolve, reject) => {
  const handlers = routes.get(method + " " + path);
  assert.ok(handlers, "Expected " + method + " " + path + " to be registered");

  const req = { params: {}, body: undefined, query };
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
    } catch (handlerError) {
      next(handlerError);
    }
  };
  next();
});

const createNoteModel = () => {
  const records = new Map([
    ["1", { _id: "1", title: "Project plan", description: "Milestones and owners", createdAt: "2026-11-12T05:00:00.000Z" }],
    ["2", { _id: "2", title: "Grocery list", description: "Project supplies and snacks", createdAt: "2026-11-11T05:00:00.000Z" }],
  ]);

  return {
    find: (filter = {}) => ({
      sort: async () => {
        const clauses = filter.$or ?? [];
        return [...records.values()]
          .filter((note) => !clauses.length || clauses.some((clause) => {
            const [field, condition] = Object.entries(clause)[0];
            return new RegExp(condition.$regex, condition.$options).test(note[field]);
          }))
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
      },
    }),
  };
};

test("creates no Mongo filter for an omitted or whitespace-only search", () => {
  assert.deepEqual(createNoteSearchFilter(), {});
  assert.deepEqual(createNoteSearchFilter("   "), {});
});

test("escapes regex syntax so search terms are treated literally", () => {
  const filter = createNoteSearchFilter("a.*[b]");
  const pattern = filter.$or[0].title.$regex;
  const matcher = new RegExp(pattern, "i");

  assert.equal(matcher.test("A.*[B] note"), true);
  assert.equal(matcher.test("Anything else"), false);
});

test("trims and accepts a bounded string query", async () => {
  const req = await invoke({ q: "  Project  " });
  assert.equal(req.noteSearchTerm, "Project");
});

test("treats a missing query as an unfiltered search", async () => {
  const req = await invoke({});
  assert.equal(req.noteSearchTerm, "");
});

test("rejects non-string and oversized search queries", async () => {
  await assert.rejects(invoke({ q: ["one", "two"] }), {
    status: 400,
    message: "Search query must be a string",
  });
  await assert.rejects(invoke({ q: "x".repeat(101) }), {
    status: 400,
    message: "Search query must be 100 characters or fewer",
  });
});

test("keeps existing Mongo ObjectId validation intact", async () => {
  const req = { params: { id: "507f1f77bcf86cd799439011" } };
  await new Promise((resolve, reject) => {
    validateNoteId(req, {}, (error) => (error ? reject(error) : resolve()));
  });
  assert.equal(req.params.id, "507f1f77bcf86cd799439011");
});

test("GET / searches note titles and descriptions case-insensitively", async () => {
  const { router, routes } = createRouter();
  registerNotesRoutes(router, createNoteModel());

  const result = await dispatch(routes, "GET", "/", { query: { q: "PROJECT" } });
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.success, true);
  assert.deepEqual(result.body.data.map((note) => note._id), ["1", "2"]);
});

test("GET / treats regex metacharacters literally and keeps empty search unfiltered", async () => {
  const { router, routes } = createRouter();
  registerNotesRoutes(router, createNoteModel());

  const literal = await dispatch(routes, "GET", "/", { query: { q: ".*" } });
  assert.equal(literal.statusCode, 200);
  assert.deepEqual(literal.body.data, []);

  const all = await dispatch(routes, "GET", "/");
  assert.equal(all.statusCode, 200);
  assert.equal(all.body.data.length, 2);
});

test("GET / rejects malformed and oversized search queries", async () => {
  const { router, routes } = createRouter();
  registerNotesRoutes(router, createNoteModel());

  const malformed = await dispatch(routes, "GET", "/", { query: { q: { $gt: "" } } });
  assert.equal(malformed.statusCode, 400);
  assert.equal(malformed.body.message, "Search query must be a string");

  const oversized = await dispatch(routes, "GET", "/", { query: { q: "x".repeat(101) } });
  assert.equal(oversized.statusCode, 400);
  assert.equal(oversized.body.message, "Search query must be 100 characters or fewer");
});
