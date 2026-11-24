import { Request } from "express";

export type UserRole = "CUSTOMER" | "AGENCY_OWNER" | "ADMIN";
export type VehicleType = "TWO_WHEELER" | "FOUR_WHEELER";
export type VehicleCategory =
  | "SEDAN"
  | "SUV"
  | "HATCHBACK"
  | "LUXURY"
  | "VAN"
  | "SCOOTER"
  | "COMMUTER"
  | "SPORTS_BIKE"
  | "CRUISER"
  | "ADVENTURE";
export type FuelType = "PETROL" | "DIESEL" | "ELECTRIC" | "HYBRID" | "CNG";
export type Transmission = "MANUAL" | "AUTOMATIC";
export type VehicleStatus = "AVAILABLE" | "UNAVAILABLE" | "MAINTENANCE";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type BookingStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "FAILED";
export type DurationType = "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";
export type MaintenanceStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  agencyId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface VehicleFilterParams extends PaginationParams {
  search?: string;
  type?: VehicleType;
  category?: VehicleCategory;
  fuelType?: FuelType;
  transmission?: Transmission;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  startDate?: string;
  endDate?: string;
  status?: VehicleStatus;
  approvalStatus?: ApprovalStatus;
  agencyId?: string;
}

export interface PriceBreakdown {
  totalDays: number;
  durationType: DurationType;
  applicableRate: number;
  basePrice: number;
  securityDeposit: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  rateLabel: string;
}
