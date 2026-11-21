export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
export const AUTH_TOKEN_TTL_SECONDS = 60 * 60;
export const AUTH_TOKEN_ISSUER = "notes-evolved";
export const AUTH_TOKEN_AUDIENCE = "notes-evolved-api";

export const getJwtSecret = (secret = process.env.JWT_SECRET) => {
  if (typeof secret !== "string" || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 bytes");
  }
  return secret;
};
