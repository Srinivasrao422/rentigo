import { Request, Response, NextFunction } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { ApiError } from "../utils/ApiError.js";

// 100 requests per minute per IP for general endpoints
const generalLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60,
});

// 15 requests per 15 minutes per IP for auth endpoints (brute-force defense)
const authLimiter = new RateLimiterMemory({
  points: 15,
  duration: 900,
});

export const apiRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
  generalLimiter
    .consume(ip)
    .then(() => next())
    .catch(() => {
      next(new ApiError(429, "Too many requests. Please try again shortly."));
    });
};

export const authRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
  authLimiter
    .consume(ip)
    .then(() => next())
    .catch(() => {
      next(new ApiError(429, "Too many login attempts. Please wait 15 minutes before retrying."));
    });
};
