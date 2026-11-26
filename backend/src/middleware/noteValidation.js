import {
  NOTE_DESCRIPTION_MAX_LENGTH,
  NOTE_SEARCH_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
  NOTE_DEFAULT_PAGE_SIZE,
  NOTE_MAX_PAGE_SIZE,
  NOTE_MAX_SKIP,
} from "../config/noteConstraints.js";
import {
  DEFAULT_NOTE_SORT,
  NOTE_SORT_FIELDS,
  NOTE_SORT_ORDERS,
  createNoteSort,
} from "../utils/noteSorting.js";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

export const validateNoteId = (req, _res, next) => {
  if (typeof req.params?.id !== "string" || !OBJECT_ID_PATTERN.test(req.params.id)) {
    return next(badRequest("Invalid note id"));
  }
  return next();
};

export const validateNoteSearchQuery = (req, _res, next) => {
  const query = req.query?.q;
  if (query === undefined) {
    req.noteSearchTerm = "";
    return next();
  }
  if (typeof query !== "string") {
    return next(badRequest("Search query must be a string"));
  }
  const normalizedQuery = query.trim();
  if (normalizedQuery.length > NOTE_SEARCH_MAX_LENGTH) {
    return next(badRequest("Search query must be " + NOTE_SEARCH_MAX_LENGTH + " characters or fewer"));
  }
  req.noteSearchTerm = normalizedQuery;
  return next();
};

export const validateNoteSortQuery = (req, _res, next) => {
  const sortBy = req.query?.sortBy ?? DEFAULT_NOTE_SORT.sortBy;
  const sortOrder = req.query?.sortOrder ?? DEFAULT_NOTE_SORT.sortOrder;
  if (typeof sortBy !== "string" || !NOTE_SORT_FIELDS.includes(sortBy)) {
    return next(badRequest("Sort field must be one of: " + NOTE_SORT_FIELDS.join(", ")));
  }
  if (typeof sortOrder !== "string" || !NOTE_SORT_ORDERS.includes(sortOrder)) {
    return next(badRequest("Sort order must be either asc or desc"));
  }
  req.noteSort = createNoteSort(sortBy, sortOrder);
  return next();
};

const parsePositiveInteger = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

export const validateNotePaginationQuery = (req, _res, next) => {
  const page = parsePositiveInteger(req.query?.page, 1);
  const limit = parsePositiveInteger(req.query?.limit, NOTE_DEFAULT_PAGE_SIZE);

  if (page === null) return next(badRequest("Page must be a positive integer"));
  if (limit === null || limit > NOTE_MAX_PAGE_SIZE) {
    return next(badRequest("Limit must be a positive integer no greater than " + NOTE_MAX_PAGE_SIZE));
  }
  if ((page - 1) * limit > NOTE_MAX_SKIP) {
    return next(badRequest("Requested page is too far into the collection"));
  }

  req.notePagination = { page, limit };
  return next();
};

export const validateNoteBody = ({ partial = false } = {}) => (req, _res, next) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return next(badRequest("Request body must be a JSON object"));
  }
  const fields = Object.keys(body);
  const allowedFields = new Set(partial ? ["title", "description", "isPinned"] : ["title", "description"]);
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
    if (field === "isPinned") {
      if (typeof body[field] !== "boolean") {
        return next(badRequest("isPinned must be a boolean"));
      }
      normalizedBody.isPinned = body.isPinned;
      continue;
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
