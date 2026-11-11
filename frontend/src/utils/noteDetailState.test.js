import test from "node:test";
import assert from "node:assert/strict";
import { getNoteDetailState } from "./noteDetailState.js";

test("keeps a direct note route in loading state before the first fetch completes", () => {
  assert.equal(getNoteDetailState({ isLoading: true, note: undefined }), "loading");
});

test("returns ready when the requested note is available", () => {
  assert.equal(getNoteDetailState({ isLoading: false, note: { id: "note-1" } }), "ready");
});

test("returns missing only after loading completes without a matching note", () => {
  assert.equal(getNoteDetailState({ isLoading: false, note: null }), "missing");
});
