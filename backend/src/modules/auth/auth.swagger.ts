import type { OpenAPIV3 } from "openapi-types";

export const authPaths: OpenAPIV3.PathsObject = {

    "/auth/": {
        post: {
            tags: ["Auth"],
            summary: "Register a new user",
            description:
                "Creates a new account with the role hardcoded to **viewer**. " +
                "Admin and editor accounts can only be created by an existing admin via `POST /users/`.",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/RegisterInput" },
                        example: {
                            name: "Jane Doe",
                            email: "jane@example.com",
                            password: "securePass123",
                        },
                    },
                },
            },
            responses: {
                "201": {
                    description: "User registered successfully",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/TokenResponse" },
                        },
                    },
                },
                "400": { $ref: "#/components/responses/ValidationError" },
                "409": { $ref: "#/components/responses/Conflict" },
                "429": { $ref: "#/components/responses/RateLimited" },
            },
        },
    },

    "/auth/login": {
        post: {
            tags: ["Auth"],
            summary: "Login",
            description:
                "Authenticates a user and returns a short-lived **access token** (15 min) " +
                "and a long-lived **refresh token** (7 days).",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/LoginInput" },
                        example: {
                            email: "jane@example.com",
                            password: "securePass123",
                        },
                    },
                },
            },
            responses: {
                "200": {
                    description: "Login successful",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/TokenResponse" },
                        },
                    },
                },
                "400": { $ref: "#/components/responses/ValidationError" },
                "401": { $ref: "#/components/responses/Unauthorized" },
                "429": { $ref: "#/components/responses/RateLimited" },
            },
        },
    },
};
