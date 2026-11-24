import { Response } from "express";
import { AuthRequest } from "../types/index.js";
import { AdminService } from "../services/admin.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export class AdminController {
  static getAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const analytics = await AdminService.getSystemAnalytics();
    res.json(ApiResponse.success(analytics, "System analytics retrieved"));
  });

  static getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const users = await AdminService.getAllUsers();
    res.json(ApiResponse.success(users, "System users retrieved"));
  });

  static toggleUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;
    const user = await AdminService.toggleUserStatus(id, isActive);
    res.json(ApiResponse.success(user, `User ${isActive ? "activated" : "deactivated"}`));
  });

  static getAgencies = asyncHandler(async (req: AuthRequest, res: Response) => {
    const agencies = await AdminService.getAllAgencies();
    res.json(ApiResponse.success(agencies, "Agencies retrieved"));
  });

  static approveAgency = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { isApproved } = req.body;
    const agency = await AdminService.approveAgency(id, isApproved);
    res.json(ApiResponse.success(agency, `Agency ${isApproved ? "approved" : "suspended"}`));
  });

  static getVehicles = asyncHandler(async (req: AuthRequest, res: Response) => {
    const vehicles = await AdminService.getAllVehiclesForAdmin();
    res.json(ApiResponse.success(vehicles, "All vehicle listings retrieved"));
  });
}
