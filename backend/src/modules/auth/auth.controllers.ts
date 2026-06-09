import type { Request, Response, NextFunction } from "express";

import {
    registerUserService,
    loginUserService
} from "./auth.services.js";

import {
    verifyRefreshToken,
    generateAccessToken
} from "../../utils/jwt.js";

import {
    getUserById,
    deleteRefreshToken
} from "../../db/queryFunctions.js";

import { AppError } from "../../utils/apiError.js";

export const registerUserController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await registerUserService(
            req.body.name,
            req.body.email,
            req.body.password,
            "viewer"
        );

        // Set httpOnly cookie for refresh token
        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            success: true,
            data: {
                accessToken: result.accessToken
            }
        });

    } catch (error) {
        next(error);
    }
};

export const loginUserController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await loginUserService(
            req.body.email,
            req.body.password
        );

        // Set httpOnly cookie for refresh token
        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                accessToken: result.accessToken
            }
        });

    } catch (error) {
        next(error);
    }
};

export const refreshUserController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            throw new AppError("Refresh token required", 401);
        }

        const storedToken = await verifyRefreshToken(refreshToken);
        const user = await getUserById(storedToken.user_id);
        if (!user) {
            throw new AppError("Account no longer exists", 401);
        }

        const accessToken = generateAccessToken(user.id, user.role);

        res.status(200).json({
            success: true,
            data: {
                accessToken
            }
        });
    } catch (error) {
        next(error);
    }
};

export const logoutUserController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await deleteRefreshToken(refreshToken);
        }

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        next(error);
    }
};