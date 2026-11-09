import { failureResponse } from "../utils/apiResponse.js";

const getStatusCode = (error) => {
  if (error?.type === "entity.too.large") return 413;
  if (error?.type === "entity.parse.failed") return 400;
  if (error?.name === "ValidationError" || error?.name === "CastError") return 400;
  if (error?.code === 11000) return 409;

  const status = Number(error?.status ?? error?.statusCode);
  return Number.isInteger(status) && status >= 400 && status < 500 ? status : 500;
};

export const notFoundHandler = (_req, _res, next) => {
  const error = new Error("Route not found");
  error.status = 404;
  next(error);
};

export const errorHandler = (error, _req, res, next) => {
  if (res.headersSent) return next(error);

  const status = getStatusCode(error);
  if (status >= 500) {
    console.error("Request failed:", error);
  }

  const message = status >= 500 ? "Internal server error" : error.message || "Request failed";
  return res.status(status).json(failureResponse(message));
};

export default errorHandler;
