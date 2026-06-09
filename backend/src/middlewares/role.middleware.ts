import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/apiError.js";
import type { User } from "../types/user.js";

type Role = User["role"];

/**
 * Role-based authorization middleware.
 *
 * Reads req.user.role which was set by `authenticate` from a fresh DB query.
 * No additional DB call needed here — authenticate already paid that cost and
 * the role on req.user is authoritative for the lifetime of this request.
 *
 * Security chain:
 *   JWT verified (signature) → userId extracted → DB query in authenticate
 *   → req.user.role set from DB → requireRole ch   ecks that role here.
 *
 * Must be used AFTER the `authenticate` middleware.
 *
 * Usage:
 *   router.get('/admin-only', authenticate, requireRole("admin"), handler)
 *   router.get('/staff',      authenticate, requireRole("admin", "editor"), handler)
 */
export const requireRole = (...allowedRoles: Role[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            return next(new AppError("Unauthorized — not authenticated", 401));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(
                new AppError(
                    `Forbidden — requires role: ${allowedRoles.join(" or ")}`,
                    403
                )
            );
        }

        next();
    };
};
