import {
    createUser,
    getAllUsers,
    getUserById,
    getUserByEmail,
    updateUser,
    deleteUser,
} from "../../db/queryFunctions.js";
import { hashPassword } from "../../utils/hash.js";
import { AppError } from "../../utils/apiError.js";
import type { User } from "../../types/user.js";
import type {
    CreateUserByAdminInput,
    AdminUpdateUserInput,
    SelfUpdateInput,
} from "./users.validation.js";

// ─── Helper: strip password from a user row ──────────────────────────────────

const safeUser = (user: User) => {
    const { password: _p, ...rest } = user;
    return rest;
};

// ─── ADMIN: List all users ────────────────────────────────────────────────────

export const getAllUsersService = async () => {
    return await getAllUsers(); // already excludes password in SQL
};

// ─── ADMIN / SELF: Get one user ───────────────────────────────────────────────

export const getUserByIdService = async (id: string) => {
    const user = await getUserById(id);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    return safeUser(user);
};

// ─── ADMIN: Create a user with any role ──────────────────────────────────────

export const createUserByAdminService = async (
    data: CreateUserByAdminInput
) => {
    const { name, email, password, role } = data;

    const existing = await getUserByEmail(email);
    if (existing) {
        throw new AppError("A user with this email already exists", 409);
    }

    const hashedPassword = await hashPassword(password);
    const user = await createUser(name, email, hashedPassword, role);

    return safeUser(user);
};

// ─── ADMIN: Update name / role of any user ───────────────────────────────────

export const adminUpdateUserService = async (
    targetId: string,
    requestingUserId: string,
    data: AdminUpdateUserInput
) => {
    const target = await getUserById(targetId);
    if (!target) {
        throw new AppError("User not found", 404);
    }

    // An admin cannot change their own role (prevents accidental self-demotion)
    if (targetId === requestingUserId && data.role !== undefined) {
        throw new AppError("Admins cannot change their own role", 403);
    }

    const newName = data.name ?? target.name;
    const newRole = data.role ?? target.role;

    const updated = await updateUser(targetId, newName, newRole);
    if (!updated) {
        throw new AppError("User not found", 404);
    }

    return safeUser(updated);
};

// ─── ADMIN: Delete any user ───────────────────────────────────────────────────

export const adminDeleteUserService = async (
    targetId: string,
    requestingUserId: string
) => {
    if (targetId === requestingUserId) {
        throw new AppError("Admins cannot delete their own account", 403);
    }

    const deleted = await deleteUser(targetId);
    if (!deleted) {
        throw new AppError("User not found", 404);
    }

    return safeUser(deleted);
};

// ─── SELF: Get own profile ────────────────────────────────────────────────────

export const getSelfService = async (userId: string) => {
    return getUserByIdService(userId);
};

// ─── SELF: Update own name / password ────────────────────────────────────────

export const selfUpdateService = async (
    userId: string,
    data: SelfUpdateInput
) => {
    const user = await getUserById(userId);
    if (!user) {
        throw new AppError("User not found", 404);
    }

    const newName = data.name ?? user.name;

    let newPassword = user.password;
    if (data.password) {
        newPassword = await hashPassword(data.password);
    }

    // updateUser only handles name + role; we need a dedicated query for password
    // so we inline the SQL update here via the pool directly
    const { pool } = await import("../../config/db.js");

    const result = await pool.query<User>(
        `UPDATE users
         SET name = $1, password = $2
         WHERE id = $3
         RETURNING *`,
        [newName, newPassword, userId]
    );

    const updated = result.rows[0];
    if (!updated) {
        throw new AppError("User not found", 404);
    }

    return safeUser(updated);
};

// ─── SELF: Delete own account ─────────────────────────────────────────────────

export const selfDeleteService = async (userId: string) => {
    const deleted = await deleteUser(userId);
    if (!deleted) {
        throw new AppError("User not found", 404);
    }

    return safeUser(deleted);
};
