import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../config/auth.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

export const validateAuthCredentials = ({ registration = false } = {}) => (req, _res, next) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return next(badRequest("Request body must be a JSON object"));
  }

  const unsupportedField = Object.keys(body).find((field) => !["email", "password"].includes(field));
  if (unsupportedField) return next(badRequest(`Unsupported authentication field: ${unsupportedField}`));

  if (typeof body.email !== "string") return next(badRequest("Email is required"));
  const email = body.email.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return next(badRequest("A valid email address is required"));
  }

  if (typeof body.password !== "string") return next(badRequest("Password is required"));
  const passwordLength = Array.from(body.password).length;
  if (passwordLength === 0 || passwordLength > PASSWORD_MAX_LENGTH) {
    return next(badRequest(`Password must be between 1 and ${PASSWORD_MAX_LENGTH} characters`));
  }
  if (registration && passwordLength < PASSWORD_MIN_LENGTH) {
    return next(badRequest(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`));
  }

  req.authCredentials = { email, password: body.password };
  return next();
};
