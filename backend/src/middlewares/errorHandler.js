import { logger } from "../utils/logger.js";

export const errorHandler = (err, _req, res, _next) => {
  // Default to 500 if not set
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Internal server error";

  if (!err.isOperational) {
    logger.error("Unexpected error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * Wraps an async route handler to catch errors and forward to error handler.
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
