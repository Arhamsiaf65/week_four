import { pool } from "../config/db.js";
import type { User } from "../types/user.js";
import type { RefreshToken } from "../types/token.js";
import { AppError } from "../utils/apiError.js";


export const createUser = async (
    name: string,
    email: string,
    password: string,
    role: string
): Promise<User> => {
    const result = await pool.query<User>(
        `
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [name, email, password, role]
    );

    const user = result.rows[0];
    if (!user) {
        throw new AppError("User not found", 404);
    }
    return user;
};

/**
 * READ ALL USERS (no password returned)
 */
export const getAllUsers = async () => {
    const result = await pool.query<Omit<User, "password">>(
        `SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`
    );

    return result.rows;
};

/**
 * READ USER BY EMAIL
 */
export const getUserByEmail = async (email: string) => {
    const result = await pool.query<User>(
        `SELECT * FROM users WHERE email = $1`,
        [email]
    );

    return result.rows[0];
};

/**
 * READ USER BY ID
 */
export const getUserById = async (id: string) => {
    const result = await pool.query<User>(
        `SELECT * FROM users WHERE id = $1`,
        [id]
    );

    return result.rows[0];
};

/**
 * UPDATE USER
 */
export const updateUser = async (
    id: string,
    name: string,
    role: string
) => {
    const result = await pool.query<User>(
        `
        UPDATE users
        SET name = $1,
            role = $2
        WHERE id = $3
        RETURNING *
        `,
        [name, role, id]
    );

    return result.rows[0];
};

/**
 * DELETE USER
 */
export const deleteUser = async (id: string) => {
    const result = await pool.query<User>(
        `
        DELETE FROM users
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0];
};

//
// =========================
// REFRESH TOKEN - CRUD
// =========================
//

/**
 * CREATE REFRESH TOKEN
 */
export const storeRefreshToken = async (
    user_id: string,
    token: string,
    expires_at: Date
) => {
    const result = await pool.query<RefreshToken>(
        `
        INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [user_id, token, expires_at]
    );

    return result.rows[0];
};

/**
 * READ REFRESH TOKEN (by token)
 */
export const getRefreshToken = async (token: string) => {
    const result = await pool.query<RefreshToken>(
        `
        SELECT * FROM refresh_tokens
        WHERE token = $1
        `,
        [token]
    );

    return result.rows[0];
};

/**
 * READ ALL TOKENS OF A USER
 */
export const getUserRefreshTokens = async (user_id: string) => {
    const result = await pool.query<RefreshToken>(
        `
        SELECT * FROM refresh_tokens
        WHERE user_id = $1
        `,
        [user_id]
    );

    return result.rows;
};

/**
 * DELETE SINGLE TOKEN (logout)
 */
export const deleteRefreshToken = async (token: string) => {
    const result = await pool.query<RefreshToken>(
        `
        DELETE FROM refresh_tokens
        WHERE token = $1
        RETURNING *
        `,
        [token]
    );

    return result.rows[0];
};

/**
 * DELETE ALL TOKENS OF USER (logout all devices)
 */
export const deleteUserRefreshTokens = async (user_id: string) => {
    const result = await pool.query<RefreshToken>(
        `
        DELETE FROM refresh_tokens
        WHERE user_id = $1
        RETURNING *
        `,
        [user_id]
    );

    return result.rows;
};


export const deleteExpiredTokens = async () => {
    const result = await pool.query<RefreshToken>(
        `
        DELETE FROM refresh_tokens
        WHERE expires_at < NOW()
        RETURNING *
        `
    );

    return result.rows;
};