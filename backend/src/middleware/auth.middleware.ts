import { Response, NextFunction } from "express";
import { AuthRequest, UserRole } from "../types/index.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { ApiError } from "../utils/ApiError.js";

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(ApiError.unauthorized("Authentication token required"));
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next(ApiError.unauthorized("Authentication token missing"));
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token expired"));
    }
    return next(ApiError.unauthorized("Invalid authentication token"));
  }
};

export const optionalAuthenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        req.user = verifyAccessToken(token);
      }
    }
    next();
  } catch {
    // Optional auth silently continues without attaching user
    next();
  }
};

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied: requires one of the following roles: ${allowedRoles.join(", ")}`
        )
      );
    }

    next();
  };
};
