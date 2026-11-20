import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveFrontendDistPath } from "./frontendDistPath.js";

test("resolves the built frontend from the repository root, independent of cwd", () => {
  const serverModuleUrl = new URL("../server.js", import.meta.url).href;
  const testDirectory = path.dirname(fileURLToPath(import.meta.url));
  const expected = path.resolve(testDirectory, "../../../frontend/dist");

  assert.equal(resolveFrontendDistPath(serverModuleUrl), expected);
  assert.match(resolveFrontendDistPath(serverModuleUrl), /frontend[\\/]dist$/);
});

test("rejects non-file server module URLs", () => {
  assert.throws(() => resolveFrontendDistPath("https://example.com/server.js"), {
    name: "TypeError",
  });
});
