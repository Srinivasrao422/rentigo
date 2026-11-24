import { Response } from "express";
import { AuthRequest } from "../types/index.js";
import { AgencyService } from "../services/agency.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export class AgencyController {
  static getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const agency = await AgencyService.getAgencyByUserId(req.user!.id);
    res.json(ApiResponse.success(agency, "Agency profile retrieved"));
  });

  static getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    const agencyId = req.user?.agencyId;
    if (!agencyId) {
      throw ApiError.forbidden("User is not linked to any agency");
    }

    const stats = await AgencyService.getAgencyDashboardStats(agencyId);
    res.json(ApiResponse.success(stats, "Agency dashboard statistics retrieved"));
  });
}
