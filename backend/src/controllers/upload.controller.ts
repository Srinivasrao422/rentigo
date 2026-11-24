import { Response } from "express";
import { AuthRequest } from "../types/index.js";
import { uploadVehicleImage } from "../config/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export class UploadController {
  static uploadSingle = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw ApiError.badRequest("No image file provided");
    }

    const uploaded = await uploadVehicleImage(req.file.buffer);
    res.json(ApiResponse.success(uploaded, "Image uploaded successfully"));
  });

  static uploadMultiple = asyncHandler(async (req: AuthRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw ApiError.badRequest("No image files provided");
    }

    const uploads = await Promise.all(
      files.map((file) => uploadVehicleImage(file.buffer))
    );

    res.json(ApiResponse.success(uploads, "Images uploaded successfully"));
  });
}
