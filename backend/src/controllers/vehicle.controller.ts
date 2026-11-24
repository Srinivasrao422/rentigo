import { Response } from "express";
import { AuthRequest } from "../types/index.js";
import { VehicleService } from "../services/vehicle.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export class VehicleController {
  static createVehicle = asyncHandler(async (req: AuthRequest, res: Response) => {
    const agencyId = req.user?.agencyId;
    if (!agencyId) {
      throw ApiError.forbidden("Only registered rental agencies can add vehicles");
    }

    const vehicle = await VehicleService.createVehicle(agencyId, req.body);
    res
      .status(201)
      .json(ApiResponse.created(vehicle, "Vehicle created successfully"));
  });

  static updateVehicle = asyncHandler(async (req: AuthRequest, res: Response) => {
    const agencyId = req.user?.agencyId;
    if (!agencyId) {
      throw ApiError.forbidden("Access denied");
    }

    const vehicle = await VehicleService.updateVehicle(
      req.params.id,
      agencyId,
      req.body
    );
    res.json(ApiResponse.success(vehicle, "Vehicle updated successfully"));
  });

  static deleteVehicle = asyncHandler(async (req: AuthRequest, res: Response) => {
    const agencyId = req.user?.agencyId;
    if (!agencyId) {
      throw ApiError.forbidden("Access denied");
    }

    await VehicleService.deleteVehicle(req.params.id, agencyId);
    res.json(ApiResponse.success(null, "Vehicle deleted successfully"));
  });

  static getAgencyVehicles = asyncHandler(async (req: AuthRequest, res: Response) => {
    const agencyId = req.user?.agencyId;
    if (!agencyId) {
      throw ApiError.forbidden("Access denied");
    }

    const vehicles = await VehicleService.getAgencyVehicles(agencyId);
    res.json(ApiResponse.success(vehicles, "Agency fleet retrieved"));
  });

  static getPublicVehicles = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await VehicleService.getPublicVehicles(req.query as any);
    res.json(ApiResponse.success(result.vehicles, "Vehicles retrieved", 200, result.meta));
  });

  static getVehicleById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const vehicle = await VehicleService.getVehicleById(req.params.id);
    res.json(ApiResponse.success(vehicle, "Vehicle details retrieved"));
  });

  static updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const agencyId = req.user?.agencyId;
    if (!agencyId) {
      throw ApiError.forbidden("Access denied");
    }

    const updated = await VehicleService.updateVehicleStatus(
      req.params.id,
      agencyId,
      req.body.status
    );
    res.json(ApiResponse.success(updated, "Vehicle status updated"));
  });

  static addMaintenance = asyncHandler(async (req: AuthRequest, res: Response) => {
    const agencyId = req.user?.agencyId;
    if (!agencyId) {
      throw ApiError.forbidden("Access denied");
    }

    const block = await VehicleService.addMaintenanceBlock(
      agencyId,
      req.params.id,
      req.body
    );
    res.status(201).json(ApiResponse.created(block, "Maintenance block scheduled"));
  });

  static adminApproval = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status, rejectionReason } = req.body;
    const vehicle = await VehicleService.adminApproveVehicle(
      req.params.id,
      status,
      rejectionReason
    );
    res.json(ApiResponse.success(vehicle, `Vehicle listing ${status.toLowerCase()}`));
  });
}
