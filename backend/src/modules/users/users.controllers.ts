import type { Request, Response, NextFunction } from "express";
import {
    getAllUsersService,
    getUserByIdService,
    createUserByAdminService,
    adminUpdateUserService,
    adminDeleteUserService,
    getSelfService,
    selfUpdateService,
    selfDeleteService,
} from "./users.services.js";

// ─── ADMIN controllers ───────────────────────────────────────────────────────

export const getAllUsersController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const users = await getAllUsersService();
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};

export const getUserByIdController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = await getUserByIdService(String(req.params.id));
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

export const createUserByAdminController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = await createUserByAdminService(req.body);
        res.status(201).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

export const adminUpdateUserController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = await adminUpdateUserService(
            String(req.params.id),
            req.user!.id,
            req.body
        );
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

export const adminDeleteUserController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const deleted = await adminDeleteUserService(
            String(req.params.id),
            req.user!.id
        );
        res.status(200).json({
            success: true,
            message: "User deleted successfully",
            data: deleted,
        });
    } catch (error) {
        next(error);
    }
};

// ─── SELF controllers ────────────────────────────────────────────────────────

export const getMeController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = await getSelfService(req.user!.id);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

export const updateMeController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = await selfUpdateService(req.user!.id, req.body);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

export const deleteMeController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const deleted = await selfDeleteService(req.user!.id);
        res.status(200).json({
            success: true,
            message: "Your account has been deleted",
            data: deleted,
        });
    } catch (error) {
        next(error);
    }
};
