import type { OpenAPIV3 } from "openapi-types";

export const usersPaths: OpenAPIV3.PathsObject = {

    // ─── SELF routes ─────────────────────────────────────────────────────────

    "/users/me": {
        get: {
            tags: ["Users — Self"],
            summary: "Get own profile",
            description: "Returns the authenticated user's profile. Password is never included.",
            security: [{ bearerAuth: [] }],
            responses: {
                "200": {
                    description: "Profile returned",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UserResponse" },
                        },
                    },
                },
                "401": { $ref: "#/components/responses/Unauthorized" },
                "404": { $ref: "#/components/responses/NotFound" },
            },
        },

        patch: {
            tags: ["Users — Self"],
            summary: "Update own profile",
            description:
                "Updates the authenticated user's **name** and/or **password**. " +
                "The `role` field is intentionally excluded — self-role escalation is impossible.",
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/SelfUpdateInput" },
                        example: {
                            name: "Jane Smith",
                            password: "newSecurePass456",
                        },
                    },
                },
            },
            responses: {
                "200": {
                    description: "Profile updated",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UserResponse" },
                        },
                    },
                },
                "400": { $ref: "#/components/responses/ValidationError" },
                "401": { $ref: "#/components/responses/Unauthorized" },
            },
        },

        delete: {
            tags: ["Users — Self"],
            summary: "Delete own account",
            description:
                "Permanently deletes the authenticated user's account. " +
                "All refresh tokens are cascade-deleted from the database.",
            security: [{ bearerAuth: [] }],
            responses: {
                "200": {
                    description: "Account deleted",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/DeleteResponse" },
                        },
                    },
                },
                "401": { $ref: "#/components/responses/Unauthorized" },
                "404": { $ref: "#/components/responses/NotFound" },
            },
        },
    },

    // ─── ADMIN routes ─────────────────────────────────────────────────────────

    "/users/": {
        get: {
            tags: ["Users — Admin"],
            summary: "List all users",
            description: "Returns all users ordered by creation date. **Requires admin role.**",
            security: [{ bearerAuth: [] }],
            responses: {
                "200": {
                    description: "List of users",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/SafeUser" },
                                    },
                                },
                            },
                        },
                    },
                },
                "401": { $ref: "#/components/responses/Unauthorized" },
                "403": { $ref: "#/components/responses/Forbidden" },
            },
        },

        post: {
            tags: ["Users — Admin"],
            summary: "Create a user with any role",
            description:
                "The **only** endpoint that can create an admin or editor account. " +
                "Requires the caller to be an admin. Registration (`POST /auth/`) always creates viewers.",
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/AdminCreateUserInput" },
                        examples: {
                            createAdmin: {
                                summary: "Create an admin",
                                value: {
                                    name: "Super Admin",
                                    email: "admin2@example.com",
                                    password: "adminPass123",
                                    role: "admin",
                                },
                            },
                            createEditor: {
                                summary: "Create an editor",
                                value: {
                                    name: "Content Editor",
                                    email: "editor@example.com",
                                    password: "editorPass123",
                                    role: "editor",
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                "201": {
                    description: "User created",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UserResponse" },
                        },
                    },
                },
                "400": { $ref: "#/components/responses/ValidationError" },
                "401": { $ref: "#/components/responses/Unauthorized" },
                "403": { $ref: "#/components/responses/Forbidden" },
                "409": { $ref: "#/components/responses/Conflict" },
            },
        },
    },

    "/users/{id}": {
        get: {
            tags: ["Users — Admin"],
            summary: "Get user by ID",
            description: "Returns a single user by UUID. **Requires admin role.**",
            security: [{ bearerAuth: [] }],
            parameters: [{ $ref: "#/components/parameters/UserId" }],
            responses: {
                "200": {
                    description: "User found",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UserResponse" },
                        },
                    },
                },
                "401": { $ref: "#/components/responses/Unauthorized" },
                "403": { $ref: "#/components/responses/Forbidden" },
                "404": { $ref: "#/components/responses/NotFound" },
            },
        },

        patch: {
            tags: ["Users — Admin"],
            summary: "Update a user's name or role",
            description:
                "Updates any user's name and/or role. **Requires admin role.**\n\n" +
                "**Constraints:**\n" +
                "- An admin cannot change their own role (prevents accidental self-demotion).\n" +
                "- At least one field (`name` or `role`) must be provided.",
            security: [{ bearerAuth: [] }],
            parameters: [{ $ref: "#/components/parameters/UserId" }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/AdminUpdateUserInput" },
                        example: { role: "editor" },
                    },
                },
            },
            responses: {
                "200": {
                    description: "User updated",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UserResponse" },
                        },
                    },
                },
                "400": { $ref: "#/components/responses/ValidationError" },
                "401": { $ref: "#/components/responses/Unauthorized" },
                "403": { $ref: "#/components/responses/Forbidden" },
                "404": { $ref: "#/components/responses/NotFound" },
            },
        },

        delete: {
            tags: ["Users — Admin"],
            summary: "Delete any user",
            description:
                "Permanently deletes a user by ID. **Requires admin role.**\n\n" +
                "**Constraint:** An admin cannot delete their own account via this endpoint. " +
                "Use `DELETE /users/me` for self-deletion.",
            security: [{ bearerAuth: [] }],
            parameters: [{ $ref: "#/components/parameters/UserId" }],
            responses: {
                "200": {
                    description: "User deleted",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/DeleteResponse" },
                        },
                    },
                },
                "401": { $ref: "#/components/responses/Unauthorized" },
                "403": { $ref: "#/components/responses/Forbidden" },
                "404": { $ref: "#/components/responses/NotFound" },
            },
        },
    },
};
