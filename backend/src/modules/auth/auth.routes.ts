import { Router } from "express";
import {
    loginUserController,
    registerUserController,
    refreshUserController,
    logoutUserController
} from './auth.controllers.js';
import { authLimiter } from "../../middlewares/auth.middleware.js";
import { validateZod } from "../../validations/validateZod.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

const router = Router();
    
router.post('/', 
    // authLimiter,
    validateZod(registerSchema),
    registerUserController
)

router.post('/login', 
    // authLimiter,
    validateZod(loginSchema),
    loginUserController
)

router.post('/refresh', refreshUserController);
router.post('/logout', logoutUserController);

export default router;