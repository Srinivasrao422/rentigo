import { z } from "zod";

export const createBookingSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  startDate: z.string().datetime({ offset: true }).or(z.string().min(10)),
  endDate: z.string().datetime({ offset: true }).or(z.string().min(10)),
  pickupLocation: z.string().min(2, "Pickup location is required"),
  dropoffLocation: z.string().min(2, "Dropoff location is required"),
  notes: z.string().optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "ACTIVE", "COMPLETED", "CANCELLED"]),
  reason: z.string().optional(),
});

export const checkAvailabilityQuerySchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  startDate: z.string().datetime({ offset: true }).or(z.string().min(10)),
  endDate: z.string().datetime({ offset: true }).or(z.string().min(10)),
});

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().optional(),
});
