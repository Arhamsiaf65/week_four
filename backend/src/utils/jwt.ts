import dotenv from 'dotenv';
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { AppError } from './apiError.js';
import { getRefreshToken } from '../db/queryFunctions.js';

dotenv.config();

const accessSecret = process.env.ACCESS_TOKEN_SECRET!;

// ─── Token payload shape ──────────────────────────────────────────────────────
// The access token carries two claims:
//   sub  → userId (who you are — identity)
//   role → role at issue time (what you can do — authorization hint)
//
// The role in the token is a READ-ONLY snapshot from the moment of login/refresh.
// It is used by the client for UI decisions (show/hide admin buttons, etc.).
// On the server, authenticate re-confirms from the DB, so the DB is always
// the final authority — role changes take effect on the next token refresh.

type AccessTokenPayload = {
    sub: string;    // userId
    role: string;   // role at issue time
    iat: number;
    exp: number;
};

// ─── Generate ─────────────────────────────────────────────────────────────────

const generateAccessToken = (userId: string, role: string): string => {
    try {
        return jwt.sign(
            {
                sub: userId,
                role,           // embedded so client can read it without a separate /me call
            },
            accessSecret,
            { expiresIn: "15m" }
        );
    } catch (error) {
        if (error instanceof Error) {
            throw new AppError(error.message, 500);
        }
        throw new AppError("Failed to generate access token", 500);
    }
};

// ─── Verify ───────────────────────────────────────────────────────────────────
// Verifies the JWT signature and returns ONLY the typed claims we care about.
// Any unexpected extra fields in the payload are discarded.

const verifyAccessToken = (token: string): { userId: string; role: string } => {
    try {
        const decoded = jwt.verify(token, accessSecret);

        if (typeof decoded === "string" || !decoded) {
            throw new AppError("Malformed token payload", 401);
        }

        const { sub, role } = decoded as AccessTokenPayload;

        if (!sub || typeof sub !== "string") {
            throw new AppError("Token is missing subject (sub) claim", 401);
        }

        if (!role || typeof role !== "string") {
            throw new AppError("Token is missing role claim", 401);
        }

        return { userId: sub, role };

    } catch (error) {
        if (error instanceof AppError) throw error;

        if (error instanceof jwt.TokenExpiredError) {
            throw new AppError("Access token expired", 401);
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new AppError("Invalid access token", 401);
        }

        throw new AppError("Token verification failed", 401);
    }
};

// ─── Refresh token (opaque, stored in DB) ────────────────────────────────────

const generateRefreshToken = (): string => {
    return crypto.randomBytes(50).toString("hex");
};

const verifyRefreshToken = async (token: string) => {
    try {
        const storedToken = await getRefreshToken(token);

        if (!storedToken) {
            throw new AppError("Invalid refresh token", 401);
        }

        if (storedToken.expires_at < new Date()) {
            throw new AppError("Refresh token expired", 401);
        }

        return storedToken;
    } catch (error) {
        if (error instanceof AppError) throw error;

        if (error instanceof Error) {
            throw new AppError(error.message, 500);
        }

        throw new AppError("Internal Server Error", 500);
    }
};

export {
    generateAccessToken,
    verifyAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
};