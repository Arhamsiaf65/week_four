import { z } from "zod";
import type { User } from "../../types/user.js";

const roleValues = ["admin", "editor", "viewer"] as const;
type Role = User["role"];

// ─── Admin: Create any user (admin/editor/viewer) ────────────────────────────

export const createUserByAdminSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, "Name must be at least 3 characters")
        .max(50, "Name cannot exceed 50 characters"),

    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email address"),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password cannot exceed 100 characters"),

    role: z.enum(roleValues, {
        message: "Role must be admin, editor, or viewer"
    }),
});

// ─── Admin: Update any user (name + role) ────────────────────────────────────

export const adminUpdateUserSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, "Name must be at least 3 characters")
        .max(50, "Name cannot exceed 50 characters")
        .optional(),

    role: z
        .enum(roleValues, {
            message: "Role must be admin, editor, or viewer"
        })
        .optional(),
}).refine(
    (data) => data.name !== undefined || data.role !== undefined,
    { message: "Provide at least one field to update (name or role)" }
);

// ─── Self: Update own profile (name + password only — no role) ───────────────

export const selfUpdateSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, "Name must be at least 3 characters")
        .max(50, "Name cannot exceed 50 characters")
        .optional(),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password cannot exceed 100 characters")
        .optional(),
}).refine(
    (data) => data.name !== undefined || data.password !== undefined,
    { message: "Provide at least one field to update (name or password)" }
);


export type CreateUserByAdminInput = z.infer<typeof createUserByAdminSchema>;
export type AdminUpdateUserInput   = z.infer<typeof adminUpdateUserSchema>;
export type SelfUpdateInput        = z.infer<typeof selfUpdateSchema>;
