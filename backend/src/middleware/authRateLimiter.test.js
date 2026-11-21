import test from "node:test";
import assert from "node:assert/strict";
import { createAuthRateLimiter } from "./authRateLimiter.js";

const invoke = (middleware, ip) => new Promise((resolve) => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  middleware({ ip }, res, () => resolve({ allowed: true, res })).then(() => {
    if (res.statusCode !== 200) resolve({ allowed: false, res });
  });
});

test("local authentication limiter blocks the eleventh request in a 15-minute window", async () => {
  let now = 1_800_000_000_000;
  const limiter = createAuthRateLimiter({ now: () => now, windows: new Map() });
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const result = await invoke(limiter, "192.0.2.1");
    assert.equal(result.allowed, true);
  }
  const blocked = await invoke(limiter, "192.0.2.1");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.res.statusCode, 429);

  now += 15 * 60_000;
  const reset = await invoke(limiter, "192.0.2.1");
  assert.equal(reset.allowed, true);
});

test("shared limiter results are honored", async () => {
  const limiter = createAuthRateLimiter({ limiter: { limit: async () => ({ success: false }) } });
  const blocked = await invoke(limiter, "192.0.2.2");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.res.statusCode, 429);
});
