import { Response } from "express";
import { AuthRequest } from "../types/index.js";
import { BookingService } from "../services/booking.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export class BookingController {
  static checkAvailability = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { vehicleId, startDate, endDate } = req.query;
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const result = await BookingService.checkAvailability(
      vehicleId as string,
      start,
      end
    );
    res.json(ApiResponse.success(result, "Availability checked"));
  });

  static calculateQuote = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { vehicleId, startDate, endDate } = req.query;
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const quote = await BookingService.calculateQuote(
      vehicleId as string,
      start,
      end
    );
    res.json(ApiResponse.success(quote, "Price quote calculated"));
  });

  static createBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customerId = req.user!.id;
    const booking = await BookingService.createBooking(customerId, req.body);
    res
      .status(201)
      .json(ApiResponse.created(booking, "Booking requested successfully"));
  });

  static getCustomerBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const bookings = await BookingService.getCustomerBookings(req.user!.id);
    res.json(ApiResponse.success(bookings, "Customer booking history retrieved"));
  });

  static getAgencyBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const agencyId = req.user?.agencyId;
    if (!agencyId) {
      res.json(ApiResponse.success([], "No agency found for user"));
      return;
    }

    const bookings = await BookingService.getAgencyBookings(agencyId);
    res.json(ApiResponse.success(bookings, "Agency bookings retrieved"));
  });

  static getAllBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const bookings = await BookingService.getAllBookings();
    res.json(ApiResponse.success(bookings, "All system bookings retrieved"));
  });

  static updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, reason } = req.body;
    const updated = await BookingService.updateBookingStatus(
      id,
      req.user!,
      status,
      reason
    );
    res.json(ApiResponse.success(updated, `Booking status updated to ${status}`));
  });

  static createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const review = await BookingService.createReview(req.user!.id, id, req.body);
    res.status(201).json(ApiResponse.created(review, "Review submitted successfully"));
  });
}
