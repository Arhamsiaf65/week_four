// src/middlewares/error.middleware.ts

import type { Request, Response, NextFunction } from "express"
import { AppError } from "../utils/apiError.js"

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {

  // Default values
  let statusCode = 500
  let message = "Internal Server Error"

  // Custom app errors
  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
  }

  // Development logging
  console.error(err)

  res.status(statusCode).json({
    success: false,
    message
  })
}