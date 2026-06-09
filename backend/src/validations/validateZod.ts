import type { Request, Response, NextFunction } from "express";

import type { ZodObject } from "zod";
import { AppError } from "../utils/apiError.js";

export const validateZod = (schema: ZodObject) => {

    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {

        const result = schema.safeParse(req.body);

        if (!result.success) {
            return next(
                new AppError(
                    result.error.issues[0]!.message,
                    400
                )
            );
        }

        req.body = result.data;

        next();
    };
};