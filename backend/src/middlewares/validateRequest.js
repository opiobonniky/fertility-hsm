import { AppError } from "../utils/AppError.js";

/**
 * Zod validation middleware.
 * Validates request body against a Zod schema.
 * Can also validate params, query by passing the appropriate source.
 */
export const validate = (schema, source = "body") => {
  return (req, _res, next) => {
    const data = source === "query" ? req.query : req[source];
    const result = schema.safeParse(data);
    if (!result.success) {
      const errorMessages = result.error.issues
        .map((err) => `[${err.path.join(".")}] ${err.message}`)
        .join("; ");
      return next(new AppError(errorMessages, 400));
    }

    // Replace with parsed/clean data.
    // For body/params, reassign directly.
    // For query, Express 5 makes req.query a getter-only property,
    // so Object.assign onto it instead.
    if (source === "query") {
      Object.assign(req.query, result.data);
    } else {
      req[source] = result.data;
    }
    next();
  };
};

/**
 * Validate request params against a Zod schema.
 */
export const validateParams = (schema) => validate(schema, "params");

/**
 * Validate request query against a Zod schema.
 */
export const validateQuery = (schema) => validate(schema, "query");
