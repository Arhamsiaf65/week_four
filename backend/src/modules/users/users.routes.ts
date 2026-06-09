import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validateZod } from "../../validations/validateZod.js";
import {
    createUserByAdminSchema,
    adminUpdateUserSchema,
    selfUpdateSchema,
} from "./users.validation.js";
import {
    getAllUsersController,
    getUserByIdController,
    createUserByAdminController,
    adminUpdateUserController,
    adminDeleteUserController,
    getMeController,
    updateMeController,
    deleteMeController,
} from "./users.controllers.js";

const router = Router();

// ─── SELF routes (any authenticated user) ─────────────────────────────────────
// GET    /users/me
// PATCH  /users/me
// DELETE /users/me

router.get(
    "/me",
    authenticate,
    getMeController
);

router.patch(
    "/me",
    authenticate,
    validateZod(selfUpdateSchema),
    updateMeController
);

router.delete(
    "/me",
    authenticate,
    deleteMeController
);

// ─── ADMIN routes ──────────────────────────────────────────────────────────────
// GET    /users/          → list all users
// POST   /users/          → create user with any role (incl. admin)
// GET    /users/:id       → get one user
// PATCH  /users/:id       → update user name / role
// DELETE /users/:id       → delete any user

router.get(
    "/",
    authenticate,
    requireRole("admin"),
    getAllUsersController
);

router.post(
    "/",
    authenticate,
    requireRole("admin"),
    validateZod(createUserByAdminSchema),
    createUserByAdminController
);

router.get(
    "/:id",
    authenticate,
    requireRole("admin"),
    getUserByIdController
);

router.patch(
    "/:id",
    authenticate,
    requireRole("admin"),
    validateZod(adminUpdateUserSchema),
    adminUpdateUserController
);

router.delete(
    "/:id",
    authenticate,
    requireRole("admin"),
    adminDeleteUserController
);

export default router;
