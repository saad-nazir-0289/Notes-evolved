import ratelimit from "../config/upstash.js";
import { failureResponse } from "../utils/apiResponse.js";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;
const MAX_LOCAL_CLIENTS = 10_000;
const localWindows = new Map();
let hasWarnedAboutUpstash = false;

const isAllowedLocally = (key) => {
  const now = Date.now();
  const current = localWindows.get(key);

  if (!current || now >= current.resetAt) {
    localWindows.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else if (current.count >= MAX_REQUESTS) {
    return false;
  } else {
    current.count += 1;
  }

  if (localWindows.size > MAX_LOCAL_CLIENTS) {
    for (const [clientKey, window] of localWindows) {
      if (now >= window.resetAt) localWindows.delete(clientKey);
    }

    if (localWindows.size > MAX_LOCAL_CLIENTS) {
      const oldestKey = localWindows.keys().next().value;
      if (oldestKey) localWindows.delete(oldestKey);
    }
  }

  return true;
};

const rateLimiter = async (req, res, next) => {
  const clientKey = req.ip || req.socket.remoteAddress || "unknown";

  if (ratelimit) {
    try {
      const result = await ratelimit.limit(clientKey);

      if (!result.success) {
        return res.status(429).json(failureResponse("Too many requests"));
      }

      return next();
    } catch (error) {
      if (!hasWarnedAboutUpstash) {
        console.error("Upstash rate limiting is unavailable; using the local fallback.", error);
        hasWarnedAboutUpstash = true;
      }
    }
  }

  if (!isAllowedLocally(clientKey)) {
    return res.status(429).json(failureResponse("Too many requests"));
  }

  return next();
};

export default rateLimiter;
