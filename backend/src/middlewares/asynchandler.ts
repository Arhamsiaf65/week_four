import type { RequestHandler } from "express";

/**
 * Wraps an async route handler so thrown errors
 * are forwarded to Express's next(error) automatically.
 * Usage:  router.get('/', asyncHandler(myAsyncController))
 */
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
