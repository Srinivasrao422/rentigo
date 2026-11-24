import { Response } from "express";
import { AuthRequest } from "../types/index.js";
import { AuthService } from "../services/auth.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export class AuthController {
  static register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AuthService.register(req.body);
    res
      .status(201)
      .json(ApiResponse.created(result, "Account registered successfully"));
  });

  static login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json(ApiResponse.success(result, "Login successful"));
  });

  static refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshToken(refreshToken);
    res.json(ApiResponse.success(result, "Token refreshed successfully"));
  });

  static logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user?.id) {
      await AuthService.logout(req.user.id);
    }
    res.json(ApiResponse.success(null, "Logged out successfully"));
  });

  static getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await AuthService.getProfile(req.user!.id);
    res.json(ApiResponse.success(profile, "User profile retrieved"));
  });
}
