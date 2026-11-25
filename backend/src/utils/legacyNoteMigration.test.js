import test from "node:test";
import assert from "node:assert/strict";
import { runLegacyNoteMigration } from "./legacyNoteMigration.js";

const ownerId = "user-123";
const createModels = (initialNotes = [], userCount = 1) => {
  const notes = initialNotes.map((note) => ({ ...note }));
  const calls = { updates: 0, countFilters: [], updateFilter: null };
  const isLegacy = (note) => !Object.prototype.hasOwnProperty.call(note, "owner") || note.owner === null;
  const Note = {
    countDocuments: async (filter) => { calls.countFilters.push(filter); return notes.filter(isLegacy).length; },
    updateMany: async (filter, update) => {
      calls.updates += 1;
      calls.updateFilter = filter;
      let modifiedCount = 0;
      for (const note of notes) {
        if (isLegacy(note)) { note.owner = update.$set.owner; modifiedCount += 1; }
      }
      return { modifiedCount };
    },
  };
  const User = {
    findOne: async ({ email }) => email === "owner@example.com" ? { _id: ownerId } : null,
    countDocuments: async () => userCount,
  };
  return { Note, User, notes, calls };
};

test("migration requires an explicit target account", async () => {
  const models = createModels();
  await assert.rejects(runLegacyNoteMigration({ ...models }), /target owner email is required/i);
  assert.equal(models.calls.updates, 0);
});

test("dry run normalizes the target email and never changes notes", async () => {
  const models = createModels([{ title: "Legacy" }, { title: "Already owned", owner: "user-456" }, { title: "Null owner", owner: null }]);
  const result = await runLegacyNoteMigration({ ...models, ownerEmail: " Owner@Example.com " });
  assert.deepEqual(result, { ownerEmail: "owner@example.com", ownerId, userCount: 1, matched: 2, modified: 0, remaining: 2, safeToApply: true, applied: false });
  assert.equal(models.calls.updates, 0);
  assert.equal(models.notes[0].owner, undefined);
  assert.equal(models.notes[1].owner, "user-456");
});

test("apply requires an exact confirmation of the selected account", async () => {
  const models = createModels([{ title: "Legacy" }]);
  await assert.rejects(runLegacyNoteMigration({ ...models, ownerEmail: "owner@example.com", apply: true, confirmedOwnerEmail: "other@example.com" }), /confirm-owner/i);
  assert.equal(models.calls.updates, 0);
});

test("apply assigns only ownerless notes when exactly one account exists", async () => {
  const models = createModels([{ title: "Missing owner" }, { title: "Null owner", owner: null }, { title: "Other account", owner: "user-456" }]);
  const result = await runLegacyNoteMigration({ ...models, ownerEmail: "owner@example.com", apply: true, confirmedOwnerEmail: "OWNER@example.com" });
  assert.deepEqual(result, { ownerEmail: "owner@example.com", ownerId, userCount: 1, matched: 2, modified: 2, remaining: 0, safeToApply: true, applied: true });
  assert.equal(models.notes[0].owner, ownerId);
  assert.equal(models.notes[1].owner, ownerId);
  assert.equal(models.notes[2].owner, "user-456");
  assert.equal(models.calls.updates, 1);
  const expectedFilter = { $or: [{ owner: { $exists: false } }, { owner: null }] };
  assert.deepEqual(models.calls.updateFilter, expectedFilter);
  assert.deepEqual(models.calls.countFilters[0], expectedFilter);
  assert.deepEqual(models.calls.countFilters[1], expectedFilter);
});

test("migration refuses to guess when multiple accounts could own legacy notes", async () => {
  const models = createModels([{ title: "Legacy" }], 2);
  const preview = await runLegacyNoteMigration({ ...models, ownerEmail: "owner@example.com" });
  assert.equal(preview.matched, 1);
  assert.equal(preview.userCount, 2);
  assert.equal(preview.safeToApply, false);
  await assert.rejects(runLegacyNoteMigration({ ...models, ownerEmail: "owner@example.com", apply: true, confirmedOwnerEmail: "owner@example.com" }), /multiple accounts exist/i);
  assert.equal(models.calls.updates, 0);
});

test("migration refuses to guess when the selected account does not exist", async () => {
  const models = createModels([{ title: "Legacy" }]);
  await assert.rejects(runLegacyNoteMigration({ ...models, ownerEmail: "missing@example.com" }), /No registered account/i);
  assert.equal(models.calls.updates, 0);
});

test("migration is idempotent after all legacy notes have an owner", async () => {
  const models = createModels([{ title: "Already migrated", owner: ownerId }], 2);
  const result = await runLegacyNoteMigration({ ...models, ownerEmail: "owner@example.com", apply: true, confirmedOwnerEmail: "owner@example.com" });
  assert.deepEqual(result, { ownerEmail: "owner@example.com", ownerId, userCount: 2, matched: 0, modified: 0, remaining: 0, safeToApply: true, applied: false });
  assert.equal(models.calls.updates, 0);
});
