import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { getUserById } from "../db/queryFunctions.js";
import { AppError } from "../utils/apiError.js";

// ─── Rate Limiter ─────────────────────────────────────────────────────────────

export const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,   // 10 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many login attempts, please try again later."
    },
});

// ─── Authentication Middleware ────────────────────────────────────────────────
//
// Security model (industry standard — JWT + single DB confirmation):
//
//   1. Verify JWT signature → proves the token is genuine and unmodified.
//   2. Extract { userId, role } from the verified token.
//   3. ONE DB query → confirms the account still exists (catches deletes/bans).
//      The role from the DB is used for req.user (always fresh).
//   4. req.user is set from DB data — downstream middleware/controllers
//      read role from here, never from req.body or raw token claims.
//
// Role changes take effect the moment a new access token is issued
// (token refresh picks up the latest DB role automatically).

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError("Access token required", 401);
        }

        const token = authHeader.split(" ")[1]!;

        // Step 1 — Verify signature + extract claims
        // verifyAccessToken throws if signature is invalid, token expired, etc.
        // It returns { userId, role } and silently drops any other claims.
        const { userId } = verifyAccessToken(token);

        // Step 2 — Single DB query: confirm the user still exists
        // and get the authoritative, fresh role from the database.
        const user = await getUserById(userId);

        if (!user) {
            throw new AppError("Account no longer exists", 401);
        }

        // Step 3 — Attach safe user to request (password stripped)
        // From this point: req.user.role is always from the DB, never from the token.
        const { password: _password, ...safeUser } = user;
        req.user = safeUser;

        next();
    } catch (error) {
        next(error);
    }
};