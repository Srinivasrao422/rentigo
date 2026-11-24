import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import { config } from "../config/index.js";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let errors = err.errors;

  // Handle Prisma unique constraint error
  if (err.code === "P2002") {
    statusCode = 409;
    const target = err.meta?.target ? ` (${err.meta.target.join(", ")})` : "";
    message = `Duplicate record found${target}. Please provide unique values.`;
  }

  // Handle Prisma not found error
  if (err.code === "P2025") {
    statusCode = 404;
    message = "The requested resource was not found in the database.";
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token signature";
  }

  // In development, log the error stack
  if (config.nodeEnv === "development" && !(err instanceof ApiError && err.statusCode < 500)) {
    console.error("❌ [API Error]:", {
      path: req.originalUrl,
      method: req.method,
      statusCode,
      message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: errors || undefined,
    stack: config.nodeEnv === "development" ? err.stack : undefined,
  });
};
