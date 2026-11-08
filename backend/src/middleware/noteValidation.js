import {
  NOTE_DESCRIPTION_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
} from "../config/noteConstraints.js";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

export const validateNoteId = (req, _res, next) => {
  if (typeof req.params?.id !== "string" || !OBJECT_ID_PATTERN.test(req.params.id)) {
    return next(badRequest("Invalid note id"));
  }

  return next();
};

export const validateNoteBody = ({ partial = false } = {}) => (req, _res, next) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return next(badRequest("Request body must be a JSON object"));
  }

  const fields = Object.keys(body);
  const allowedFields = new Set(["title", "description"]);
  const unsupportedField = fields.find((field) => !allowedFields.has(field));

  if (unsupportedField) {
    return next(badRequest(`Unsupported note field: ${unsupportedField}`));
  }

  if (fields.length === 0) {
    return next(badRequest("At least one note field is required"));
  }

  const requiredFields = partial ? fields : ["title", "description"];
  const normalizedBody = {};

  for (const field of requiredFields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      return next(badRequest(`${field} is required`));
    }

    if (typeof body[field] !== "string") {
      return next(badRequest(`${field} must be a string`));
    }

    const value = body[field].trim();
    if (!value) {
      return next(badRequest(`${field} cannot be empty`));
    }

    const maxLength = field === "title" ? NOTE_TITLE_MAX_LENGTH : NOTE_DESCRIPTION_MAX_LENGTH;
    if (value.length > maxLength) {
      return next(badRequest(`${field} must be ${maxLength} characters or fewer`));
    }

    normalizedBody[field] = value;
  }

  req.body = normalizedBody;
  return next();
};
