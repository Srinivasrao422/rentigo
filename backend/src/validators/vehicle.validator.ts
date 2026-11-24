import { z } from "zod";

const vehicleTypeEnum = z.enum(["TWO_WHEELER", "FOUR_WHEELER"]);
const vehicleCategoryEnum = z.enum([
  "SEDAN",
  "SUV",
  "HATCHBACK",
  "LUXURY",
  "VAN",
  "SCOOTER",
  "COMMUTER",
  "SPORTS_BIKE",
  "CRUISER",
  "ADVENTURE",
]);
const fuelTypeEnum = z.enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "CNG"]);
const transmissionEnum = z.enum(["MANUAL", "AUTOMATIC"]);
const vehicleStatusEnum = z.enum(["AVAILABLE", "UNAVAILABLE", "MAINTENANCE"]);

export const pricingSchema = z.object({
  dailyRate: z.coerce.number().positive("Daily rate must be greater than 0"),
  weeklyRate: z.coerce.number().positive("Weekly rate must be greater than 0"),
  monthlyRate: z.coerce.number().positive("Monthly rate must be greater than 0"),
  securityDeposit: z.coerce.number().min(0, "Security deposit cannot be negative").default(0),
  lateFeePerHour: z.coerce.number().min(0, "Late fee cannot be negative").default(0),
});

export const createVehicleSchema = z.object({
  vehicleNumber: z.string().min(3, "Vehicle registration number is required"),
  brand: z.string().min(2, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1),
  type: vehicleTypeEnum,
  category: vehicleCategoryEnum,
  fuelType: fuelTypeEnum,
  transmission: transmissionEnum,
  seatingCapacity: z.coerce.number().int().positive().default(4),
  mileage: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  features: z.array(z.string()).default([]),
  pricing: pricingSchema,
  images: z
    .array(
      z.object({
        url: z.string().url(),
        publicId: z.string().optional(),
        isPrimary: z.boolean().default(false),
        caption: z.string().optional(),
      })
    )
    .optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const updateVehicleStatusSchema = z.object({
  status: vehicleStatusEnum,
});

export const adminApprovalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional(),
});

export const maintenanceBlockSchema = z.object({
  startDate: z.string().datetime({ offset: true }).or(z.string()),
  endDate: z.string().datetime({ offset: true }).or(z.string()),
  reason: z.string().min(3, "Reason is required"),
  notes: z.string().optional(),
});

export const vehicleQuerySchema = z.object({
  search: z.string().optional(),
  type: vehicleTypeEnum.optional(),
  category: vehicleCategoryEnum.optional(),
  fuelType: fuelTypeEnum.optional(),
  transmission: transmissionEnum.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  city: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  sortBy: z.enum(["dailyRate", "createdAt", "year"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  agencyId: z.string().optional(),
});
