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

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  isActive: boolean;
  agency?: Agency | null;
  createdAt: string;
}

export interface Agency {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  address: string;
  city: string;
  state: string;
  postalCode?: string | null;
  contactPhone: string;
  contactEmail: string;
  logoUrl?: string | null;
  isApproved: boolean;
}

export interface Pricing {
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  securityDeposit: number;
  lateFeePerHour: number;
  currency: string;
}

export interface VehicleImage {
  id: string;
  url: string;
  isPrimary: boolean;
  caption?: string | null;
}

export interface Vehicle {
  id: string;
  agencyId: string;
  vehicleNumber: string;
  brand: string;
  model: string;
  year: number;
  type: VehicleType;
  category: VehicleCategory;
  fuelType: FuelType;
  transmission: Transmission;
  seatingCapacity: number;
  mileage?: string | null;
  description: string;
  features: string[];
  status: VehicleStatus;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string | null;
  isDeleted: boolean;
  pricing: Pricing;
  images: VehicleImage[];
  agency?: Agency | null;
  averageRating?: number;
  totalReviews?: number;
  createdAt: string;
}

export interface PriceQuote {
  totalDays: number;
  durationType: DurationType;
  applicableRate: number;
  basePrice: number;
  securityDeposit: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  rateLabel: string;
  isAvailable: boolean;
  conflictReason?: string;
  surgeApplied?: boolean;
  surgePercentage?: number;
  gstRate?: number;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  durationType: DurationType;
  basePrice: number;
  securityDeposit: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  pickupLocation: string;
  dropoffLocation: string;
  notes?: string | null;
  deliveryFee?: number;
  isDelivery?: boolean;
  paymentMethod?: string;
  dlNumber?: string;
  whatsappNumber?: string;
  gstAmount?: number;
  vehicle?: Vehicle | null;
  customer?: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  } | null;
  review?: {
    rating: number;
    comment?: string | null;
  } | null;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  vehicleId: string;
  customerId: string;
  rating: number;
  comment?: string | null;
  customer?: {
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
}
