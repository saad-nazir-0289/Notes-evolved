import { authRatelimit } from "../config/upstash.js";
import { failureResponse } from "../utils/apiResponse.js";

const WINDOW_MS = 15 * 60_000;
const MAX_REQUESTS = 10;
const MAX_LOCAL_CLIENTS = 10_000;
let hasWarnedAboutSharedLimiter = false;

export const createAuthRateLimiter = ({ limiter = null, now = Date.now, windows = new Map() } = {}) => (
  async (req, res, next) => {
    const clientKey = req.ip || req.socket?.remoteAddress || "unknown";

    if (limiter) {
      try {
        const result = await limiter.limit(`auth:${clientKey}`);
        if (!result.success) return res.status(429).json(failureResponse("Too many authentication attempts"));
        return next();
      } catch (error) {
        if (!hasWarnedAboutSharedLimiter) {
          console.error("Shared authentication rate limiting is unavailable; using the local fallback.", error);
          hasWarnedAboutSharedLimiter = true;
        }
      }
    }

    const currentTime = now();
    const current = windows.get(clientKey);
    if (current && currentTime < current.resetAt) {
      if (current.count >= MAX_REQUESTS) {
        return res.status(429).json(failureResponse("Too many authentication attempts"));
      }
      current.count += 1;
    } else {
      windows.set(clientKey, { count: 1, resetAt: currentTime + WINDOW_MS });
    }

    if (windows.size > MAX_LOCAL_CLIENTS) {
      for (const [key, window] of windows) {
        if (currentTime >= window.resetAt) windows.delete(key);
      }
      if (windows.size > MAX_LOCAL_CLIENTS) {
        const oldestKey = windows.keys().next().value;
        if (oldestKey) windows.delete(oldestKey);
      }
    }

    return next();
  }
);

export default createAuthRateLimiter({ limiter: authRatelimit });
