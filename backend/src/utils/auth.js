import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import {
  AUTH_TOKEN_AUDIENCE,
  AUTH_TOKEN_ISSUER,
  AUTH_TOKEN_TTL_SECONDS,
  getJwtSecret,
} from "../config/auth.js";

const scrypt = promisify(scryptCallback);
const SCRYPT_COST = 32_768;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SALT_BYTES = 16;
const KEY_BYTES = 64;
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024;
const JWT_HEADER = { alg: "HS256", typ: "JWT" };

const encodeSegment = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

const decodeSegment = (value) => {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const decoded = Buffer.from(value, "base64url");
  return decoded.toString("base64url") === value ? decoded : null;
};

export const hashPassword = async (password) => {
  if (typeof password !== "string" || Buffer.byteLength(password, "utf8") > 1024) {
    throw new TypeError("Password must be a string no larger than 1024 bytes");
  }

  const salt = randomBytes(SALT_BYTES);
  const derivedKey = await scrypt(password, salt, KEY_BYTES, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: SCRYPT_MAX_MEMORY,
  });

  return [
    "scrypt",
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
};

export const verifyPassword = async (password, storedHash) => {
  if (typeof password !== "string" || typeof storedHash !== "string") return false;
  if (Buffer.byteLength(password, "utf8") > 1024) return false;

  const parts = storedHash.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  if (Number(parts[1]) !== SCRYPT_COST
    || Number(parts[2]) !== SCRYPT_BLOCK_SIZE
    || Number(parts[3]) !== SCRYPT_PARALLELIZATION) return false;

  const salt = decodeSegment(parts[4]);
  const expected = decodeSegment(parts[5]);
  if (!salt || salt.length !== SALT_BYTES || !expected || expected.length !== KEY_BYTES) return false;

  const actual = await scrypt(password, salt, KEY_BYTES, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: SCRYPT_MAX_MEMORY,
  });

  return timingSafeEqual(actual, expected);
};

export const signAccessToken = (
  subject,
  secret,
  nowSeconds = Math.floor(Date.now() / 1000),
) => {
  const key = getJwtSecret(secret);
  if (typeof subject !== "string" || !subject.trim() || subject.length > 128) {
    throw new TypeError("A valid user id is required to issue an access token");
  }
  if (!Number.isSafeInteger(nowSeconds) || nowSeconds < 0) {
    throw new TypeError("A valid token issue time is required");
  }

  const header = encodeSegment(JWT_HEADER);
  const payload = encodeSegment({
    iss: AUTH_TOKEN_ISSUER,
    aud: AUTH_TOKEN_AUDIENCE,
    sub: subject,
    iat: nowSeconds,
    exp: nowSeconds + AUTH_TOKEN_TTL_SECONDS,
  });
  const unsignedToken = `${header}.${payload}`;
  const signature = createHmac("sha256", key).update(unsignedToken).digest("base64url");
  return `${unsignedToken}.${signature}`;
};

export const verifyAccessToken = (
  token,
  secret,
  nowSeconds = Math.floor(Date.now() / 1000),
) => {
  const key = getJwtSecret(secret);
  if (!Number.isSafeInteger(nowSeconds) || nowSeconds < 0) return null;
  if (typeof token !== "string" || token.length > 4096) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const headerBytes = decodeSegment(parts[0]);
  const payloadBytes = decodeSegment(parts[1]);
  const signature = decodeSegment(parts[2]);
  if (!headerBytes || !payloadBytes || !signature || signature.length !== 32) return null;

  let header;
  let payload;
  try {
    header = JSON.parse(headerBytes.toString("utf8"));
    payload = JSON.parse(payloadBytes.toString("utf8"));
  } catch {
    return null;
  }

  if (!header || header.alg !== "HS256" || header.typ !== "JWT"
    || Object.keys(header).some((field) => !["alg", "typ"].includes(field))) return null;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;

  const unsignedToken = `${parts[0]}.${parts[1]}`;
  const expected = createHmac("sha256", key).update(unsignedToken).digest();
  if (!timingSafeEqual(signature, expected)) return null;

  if (payload.iss !== AUTH_TOKEN_ISSUER || payload.aud !== AUTH_TOKEN_AUDIENCE
    || typeof payload.sub !== "string" || !payload.sub.trim() || payload.sub.length > 128
    || !Number.isSafeInteger(payload.iat) || !Number.isSafeInteger(payload.exp)
    || payload.iat > nowSeconds + 60
    || payload.exp <= nowSeconds
    || payload.exp <= payload.iat
    || payload.exp - payload.iat > AUTH_TOKEN_TTL_SECONDS) return null;

  return payload;
};
