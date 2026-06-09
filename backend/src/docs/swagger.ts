import swaggerUi from "swagger-ui-express";
import type { OpenAPIV3 } from "openapi-types";
import { authPaths } from "../modules/auth/auth.swagger.js";
import { usersPaths } from "../modules/users/users.swagger.js";

// ─── Full OpenAPI 3.0 Specification ──────────────────────────────────────────

const swaggerSpec: OpenAPIV3.Document = {
    openapi: "3.0.3",

    info: {
        title: "Week 2 Project API",
        version: "1.0.0",
        description:
            "REST API with JWT authentication and role-based access control.\n\n" +
            "## Authentication\n" +
            "1. Register via `POST /auth/` or login via `POST /auth/login`.\n" +
            "2. Copy the `accessToken` from the response.\n" +
            "3. Click **Authorize** and paste it as `Bearer <token>`.\n\n" +
            "## Roles\n" +
            "| Role | Created by | Access |\n" +
            "|---|---|---|\n" +
            "| `viewer` | Public registration | Self routes only |\n" +
            "| `editor` | Admin only | Self routes only |\n" +
            "| `admin` | Admin only | All routes |",
        contact: {
            name: "API Support",
        },
    },

    servers: [
        {
            url: "http://localhost:3000",
            description: "Local development server",
        },
    ],

    tags: [
        {
            name: "Auth",
            description: "Public endpoints — register and login",
        },
        {
            name: "Users — Self",
            description: "Authenticated user managing their own account",
        },
        {
            name: "Users — Admin",
            description: "Admin-only user management endpoints",
        },
    ],

    // ─── Merge all module paths ───────────────────────────────────────────────

    paths: {
        ...authPaths,
        ...usersPaths,
    },

    // ─── Reusable components ──────────────────────────────────────────────────

    components: {

        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description:
                    "JWT access token. Obtain from `POST /auth/login`. " +
                    "Format: `Bearer <token>`. Expires in 15 minutes.",
            },
        },

        // ── Parameters ───────────────────────────────────────────────────────

        parameters: {
            UserId: {
                name: "id",
                in: "path",
                required: true,
                description: "User UUID",
                schema: {
                    type: "string",
                    format: "uuid",
                    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                },
            },
        },

        // ── Request schemas ───────────────────────────────────────────────────

        schemas: {

            RegisterInput: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                    name: {
                        type: "string",
                        minLength: 3,
                        maxLength: 50,
                        example: "Jane Doe",
                    },
                    email: {
                        type: "string",
                        format: "email",
                        example: "jane@example.com",
                    },
                    password: {
                        type: "string",
                        minLength: 8,
                        maxLength: 100,
                        example: "securePass123",
                    },
                },
            },

            LoginInput: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: {
                        type: "string",
                        format: "email",
                        example: "jane@example.com",
                    },
                    password: {
                        type: "string",
                        minLength: 8,
                        example: "securePass123",
                    },
                },
            },

            AdminCreateUserInput: {
                type: "object",
                required: ["name", "email", "password", "role"],
                properties: {
                    name: {
                        type: "string",
                        minLength: 3,
                        maxLength: 50,
                        example: "Content Editor",
                    },
                    email: {
                        type: "string",
                        format: "email",
                        example: "editor@example.com",
                    },
                    password: {
                        type: "string",
                        minLength: 8,
                        maxLength: 100,
                        example: "editorPass123",
                    },
                    role: {
                        type: "string",
                        enum: ["admin", "editor", "viewer"],
                        example: "editor",
                        description: "The role to assign. Only admins can set role to admin or editor.",
                    },
                },
            },

            AdminUpdateUserInput: {
                type: "object",
                description: "At least one field required. Admins cannot change their own role.",
                properties: {
                    name: {
                        type: "string",
                        minLength: 3,
                        maxLength: 50,
                        example: "Updated Name",
                    },
                    role: {
                        type: "string",
                        enum: ["admin", "editor", "viewer"],
                        example: "editor",
                    },
                },
            },

            SelfUpdateInput: {
                type: "object",
                description:
                    "At least one field required. The `role` field is intentionally absent " +
                    "— users cannot escalate their own privileges.",
                properties: {
                    name: {
                        type: "string",
                        minLength: 3,
                        maxLength: 50,
                        example: "Jane Smith",
                    },
                    password: {
                        type: "string",
                        minLength: 8,
                        maxLength: 100,
                        example: "newSecurePass456",
                    },
                },
            },

            // ── Response schemas ──────────────────────────────────────────────

            SafeUser: {
                type: "object",
                description: "User object — password is never returned",
                properties: {
                    id: {
                        type: "string",
                        format: "uuid",
                        example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                    },
                    name: { type: "string", example: "Jane Doe" },
                    email: { type: "string", format: "email", example: "jane@example.com" },
                    role: {
                        type: "string",
                        enum: ["admin", "editor", "viewer"],
                        example: "viewer",
                    },
                    created_at: {
                        type: "string",
                        format: "date-time",
                        example: "2026-05-28T17:00:00.000Z",
                    },
                },
            },

            UserResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/SafeUser" },
                },
            },

            TokenResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: {
                        type: "object",
                        properties: {
                            accessToken: {
                                type: "string",
                                description: "JWT access token — expires in 15 minutes. Contains { sub, role }.",
                                example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                            },
                            refreshToken: {
                                type: "string",
                                description: "Opaque refresh token — expires in 7 days. Stored in the database.",
                                example: "a3f8d2c1e9b74f56a2...",
                            },
                        },
                    },
                },
            },

            DeleteResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "User deleted successfully" },
                    data: { $ref: "#/components/schemas/SafeUser" },
                },
            },

            ErrorResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "Error description" },
                },
            },
        },

        // ── Reusable error responses ──────────────────────────────────────────

        responses: {
            Unauthorized: {
                description: "401 — Missing, invalid, or expired access token",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                        example: { success: false, message: "Access token required" },
                    },
                },
            },
            Forbidden: {
                description: "403 — Authenticated but insufficient role",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                        example: { success: false, message: "Forbidden — requires role: admin" },
                    },
                },
            },
            NotFound: {
                description: "404 — Resource not found",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                        example: { success: false, message: "User not found" },
                    },
                },
            },
            Conflict: {
                description: "409 — Resource already exists",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                        example: { success: false, message: "A user with this email already exists" },
                    },
                },
            },
            ValidationError: {
                description: "400 — Request body failed Zod validation",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                        example: { success: false, message: "Password must be at least 8 characters" },
                    },
                },
            },
            RateLimited: {
                description: "429 — Too many requests (auth endpoints: 5 per 10 minutes)",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ErrorResponse" },
                        example: { success: false, message: "Too many login attempts, please try again later." },
                    },
                },
            },
        },
    },
};

export { swaggerUi, swaggerSpec };
