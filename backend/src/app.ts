import express from "express";
import helmet from 'helmet';
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./middlewares/error.middleware.js";
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import { swaggerUi, swaggerSpec } from './docs/swagger.js';
// import { setupSecurity } from "./middleware/security.js";

const app = express();

app.use((req, res, next) => {
    const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173", process.env.FRONTEND_URL];
    const origin = req.headers.origin as string;
    
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
        // Fallback for development if no origin matches
        res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    }
    
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
    }
    next();
});

app.use(helmet());
app.use(express.json());
// setupSecurity(app);
app.use(cookieParser());

// ─── API Docs ─────────────────────────────────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);

app.use(globalErrorHandler);
export default app;