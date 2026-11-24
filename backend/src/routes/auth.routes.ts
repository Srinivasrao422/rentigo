import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { registerSchema, loginSchema, refreshTokenSchema } from "../validators/auth.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post(
  "/register",
  authRateLimiter,
  validateRequest(registerSchema),
  AuthController.register
);

router.post(
  "/login",
  authRateLimiter,
  validateRequest(loginSchema),
  AuthController.login
);

router.post(
  "/refresh-token",
  validateRequest(refreshTokenSchema),
  AuthController.refreshToken
);

router.post("/logout", authenticate, AuthController.logout);

router.get("/me", authenticate, AuthController.getProfile);

export default router;
