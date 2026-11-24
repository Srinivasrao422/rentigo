import bcrypt from "bcryptjs";
import {
  UserRole,
  VehicleType,
  VehicleCategory,
  FuelType,
  Transmission,
  VehicleStatus,
  ApprovalStatus,
  BookingStatus,
  PaymentStatus,
  DurationType,
  MaintenanceStatus,
} from "../types/index.js";

export interface DevUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DevAgency {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  postalCode: string | null;
  contactPhone: string;
  contactEmail: string;
  logoUrl: string | null;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DevVehicle {
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
  mileage: string | null;
  description: string;
  features: string[];
  status: VehicleStatus;
  approvalStatus: ApprovalStatus;
  rejectionReason: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  pricing: {
    dailyRate: number;
    weeklyRate: number;
    monthlyRate: number;
    securityDeposit: number;
    lateFeePerHour: number;
    currency: string;
  };
  images: Array<{
    id: string;
    url: string;
    isPrimary: boolean;
    caption: string | null;
  }>;
}

export interface DevBooking {
  id: string;
  bookingNumber: string;
  customerId: string;
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  durationType: DurationType;
  basePrice: number;
  securityDeposit: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  rejectionReason: string | null;
  cancellationReason: string | null;
  pickupLocation: string;
  dropoffLocation: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DevMaintenance {
  id: string;
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: MaintenanceStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DevReview {
  id: string;
  bookingId: string;
  vehicleId: string;
  customerId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

// Realistic Seed data
export const INITIAL_USERS: DevUser[] = [
  {
    id: "u-admin-001",
    email: "admin@rentigo.com",
    passwordHash: bcrypt.hashSync("Admin@SecurePass2026!", 10),
    firstName: "Sarah",
    lastName: "Jenkins",
    phone: "+1-555-0100",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    role: "ADMIN",
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  },
  {
    id: "u-agency-001",
    email: "owner@apexrentals.com",
    passwordHash: bcrypt.hashSync("Agency@SecurePass2026!", 10),
    firstName: "Marcus",
    lastName: "Vance",
    phone: "+1-555-0101",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    role: "AGENCY_OWNER",
    isActive: true,
    createdAt: new Date("2026-01-05T00:00:00Z"),
    updatedAt: new Date("2026-01-05T00:00:00Z"),
  },
  {
    id: "u-agency-002",
    email: "contact@cityridemotors.com",
    passwordHash: bcrypt.hashSync("Agency@SecurePass2026!", 10),
    firstName: "Elena",
    lastName: "Rostova",
    phone: "+1-555-0102",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    role: "AGENCY_OWNER",
    isActive: true,
    createdAt: new Date("2026-01-10T00:00:00Z"),
    updatedAt: new Date("2026-01-10T00:00:00Z"),
  },
  {
    id: "u-customer-001",
    email: "alex.rider@example.com",
    passwordHash: bcrypt.hashSync("Customer@SecurePass2026!", 10),
    firstName: "Alex",
    lastName: "Rider",
    phone: "+1-555-0103",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    role: "CUSTOMER",
    isActive: true,
    createdAt: new Date("2026-01-15T00:00:00Z"),
    updatedAt: new Date("2026-01-15T00:00:00Z"),
  },
  {
    id: "u-customer-002",
    email: "maria.garcia@example.com",
    passwordHash: bcrypt.hashSync("Customer@SecurePass2026!", 10),
    firstName: "Maria",
    lastName: "Garcia",
    phone: "+1-555-0104",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    role: "CUSTOMER",
    isActive: true,
    createdAt: new Date("2026-01-20T00:00:00Z"),
    updatedAt: new Date("2026-01-20T00:00:00Z"),
  },
];

export const INITIAL_AGENCIES: DevAgency[] = [
  {
    id: "ag-001",
    userId: "u-agency-001",
    name: "Apex Luxury & Fleet Rentals",
    description: "Premium car and electric vehicle rental agency serving downtown and metropolitan airports.",
    address: "742 Evergreen Blvd",
    city: "San Francisco",
    state: "CA",
    postalCode: "94105",
    contactPhone: "+1-415-555-0199",
    contactEmail: "owner@apexrentals.com",
    logoUrl: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=200&q=80",
    isApproved: true,
    createdAt: new Date("2026-01-05T00:00:00Z"),
    updatedAt: new Date("2026-01-05T00:00:00Z"),
  },
  {
    id: "ag-002",
    userId: "u-agency-002",
    name: "CityRide Two-Wheelers & Compacts",
    description: "Specialized in city commuter scooters, sports bikes, and fuel-efficient hatchbacks.",
    address: "1200 Market Street",
    city: "Austin",
    state: "TX",
    postalCode: "78701",
    contactPhone: "+1-512-555-0244",
    contactEmail: "contact@cityridemotors.com",
    logoUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=200&q=80",
    isApproved: true,
    createdAt: new Date("2026-01-10T00:00:00Z"),
    updatedAt: new Date("2026-01-10T00:00:00Z"),
  },
];

export const INITIAL_VEHICLES: DevVehicle[] = [
  {
    id: "veh-001",
    agencyId: "ag-001",
    vehicleNumber: "CA-7XYZ99",
    brand: "Tesla",
    model: "Model 3 Long Range",
    year: 2024,
    type: "FOUR_WHEELER",
    category: "SEDAN",
    fuelType: "ELECTRIC",
    transmission: "AUTOMATIC",
    seatingCapacity: 5,
    mileage: "358 miles range",
    description: "Whisper-quiet, autopilot-equipped electric sedan with premium sound and unmatched acceleration.",
    features: ["Autopilot", "Glass Roof", "Navigation", "Bluetooth", "Heated Seats", "Backup Camera"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-01-12T00:00:00Z"),
    updatedAt: new Date("2026-01-12T00:00:00Z"),
    pricing: {
      dailyRate: 75.0,
      weeklyRate: 450.0,
      monthlyRate: 1600.0,
      securityDeposit: 250.0,
      lateFeePerHour: 20.0,
      currency: "USD",
    },
    images: [
      {
        id: "img-001",
        url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Front angle in pearl white",
      },
      {
        id: "img-002",
        url: "https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=1200&q=80",
        isPrimary: false,
        caption: "Minimalist cockpit & touch display",
      },
    ],
  },
  {
    id: "veh-002",
    agencyId: "ag-001",
    vehicleNumber: "CA-9SUV12",
    brand: "BMW",
    model: "X5 xDrive40i",
    year: 2024,
    type: "FOUR_WHEELER",
    category: "SUV",
    fuelType: "HYBRID",
    transmission: "AUTOMATIC",
    seatingCapacity: 7,
    mileage: "24 mpg",
    description: "Flagship luxury SUV with panoramic sunroof, 3rd row seating, and executive leather interior.",
    features: ["AWD", "Panoramic Sunroof", "360 Camera", "Apple CarPlay", "Harman Kardon Audio", "Adaptive Cruise"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-01-14T00:00:00Z"),
    updatedAt: new Date("2026-01-14T00:00:00Z"),
    pricing: {
      dailyRate: 110.0,
      weeklyRate: 650.0,
      monthlyRate: 2300.0,
      securityDeposit: 400.0,
      lateFeePerHour: 30.0,
      currency: "USD",
    },
    images: [
      {
        id: "img-003",
        url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Exterior view in Arctic Grey",
      },
    ],
  },
  {
    id: "veh-003",
    agencyId: "ag-002",
    vehicleNumber: "TX-2BIK88",
    brand: "Ducati",
    model: "Monster Plus",
    year: 2023,
    type: "TWO_WHEELER",
    category: "SPORTS_BIKE",
    fuelType: "PETROL",
    transmission: "MANUAL",
    seatingCapacity: 2,
    mileage: "45 mpg",
    description: "Pure Italian thrill. Lightweight, agile, and equipped with cornering ABS and quick shifter.",
    features: ["Quick Shifter", "Cornering ABS", "TFT Display", "Riding Modes", "Ducati Wheelie Control"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-01-18T00:00:00Z"),
    updatedAt: new Date("2026-01-18T00:00:00Z"),
    pricing: {
      dailyRate: 65.0,
      weeklyRate: 380.0,
      monthlyRate: 1300.0,
      securityDeposit: 300.0,
      lateFeePerHour: 15.0,
      currency: "USD",
    },
    images: [
      {
        id: "img-004",
        url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Ducati Red Monster in full profile",
      },
    ],
  },
  {
    id: "veh-004",
    agencyId: "ag-002",
    vehicleNumber: "TX-5VES33",
    brand: "Vespa",
    model: "GTS Super 300",
    year: 2024,
    type: "TWO_WHEELER",
    category: "SCOOTER",
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    seatingCapacity: 2,
    mileage: "70 mpg",
    description: "Iconic Italian urban cruiser. Effortless twist-and-go throttle with helmet storage under seat.",
    features: ["Under-seat Storage", "USB Port", "ABS", "LED Headlights", "Passenger Footrests"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-01-20T00:00:00Z"),
    updatedAt: new Date("2026-01-20T00:00:00Z"),
    pricing: {
      dailyRate: 35.0,
      weeklyRate: 190.0,
      monthlyRate: 650.0,
      securityDeposit: 150.0,
      lateFeePerHour: 10.0,
      currency: "USD",
    },
    images: [
      {
        id: "img-005",
        url: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Vintage Olive Vespa GTS",
      },
    ],
  },
  {
    id: "veh-005",
    agencyId: "ag-001",
    vehicleNumber: "CA-4HON55",
    brand: "Honda",
    model: "Civic Sport",
    year: 2024,
    type: "FOUR_WHEELER",
    category: "SEDAN",
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    seatingCapacity: 5,
    mileage: "35 mpg",
    description: "Dependable, fuel-efficient daily driver with sporty handling, Honda Sensing suite, and spacious boot.",
    features: ["Honda Sensing", "CarPlay / Android Auto", "Lane Assist", "Eco Mode", "Keyless Entry"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-01-22T00:00:00Z"),
    updatedAt: new Date("2026-01-22T00:00:00Z"),
    pricing: {
      dailyRate: 48.0,
      weeklyRate: 280.0,
      monthlyRate: 980.0,
      securityDeposit: 150.0,
      lateFeePerHour: 15.0,
      currency: "USD",
    },
    images: [
      {
        id: "img-006",
        url: "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Sonic Gray Pearl Civic",
      },
    ],
  },
  {
    id: "veh-006",
    agencyId: "ag-002",
    vehicleNumber: "TX-7ROY41",
    brand: "Royal Enfield",
    model: "Hunter 350",
    year: 2023,
    type: "TWO_WHEELER",
    category: "CRUISER",
    fuelType: "PETROL",
    transmission: "MANUAL",
    seatingCapacity: 2,
    mileage: "80 mpg",
    description: "Classic retro charm with modern ergonomics. Thumping exhaust note and easy city maneuvering.",
    features: ["Tripper Navigation", "Dual-Channel ABS", "USB Charging", "Alloy Wheels"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-01-25T00:00:00Z"),
    updatedAt: new Date("2026-01-25T00:00:00Z"),
    pricing: {
      dailyRate: 40.0,
      weeklyRate: 230.0,
      monthlyRate: 780.0,
      securityDeposit: 200.0,
      lateFeePerHour: 10.0,
      currency: "USD",
    },
    images: [
      {
        id: "img-007",
        url: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Rebel Blue Hunter 350",
      },
    ],
  },
  {
    id: "veh-007",
    agencyId: "ag-001",
    vehicleNumber: "CA-1POR99",
    brand: "Porsche",
    model: "Taycan 4S",
    year: 2024,
    type: "FOUR_WHEELER",
    category: "LUXURY",
    fuelType: "ELECTRIC",
    transmission: "AUTOMATIC",
    seatingCapacity: 4,
    mileage: "280 miles range",
    description: "Breathtaking high-performance German engineering with 522 hp, launch control, and active air suspension.",
    features: ["Launch Control", "Active Air Suspension", "Burmester 3D Sound", "Panoramic Glass", "Sport Chrono"],
    status: "AVAILABLE",
    approvalStatus: "PENDING",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-02-01T00:00:00Z"),
    updatedAt: new Date("2026-02-01T00:00:00Z"),
    pricing: {
      dailyRate: 220.0,
      weeklyRate: 1350.0,
      monthlyRate: 4800.0,
      securityDeposit: 1000.0,
      lateFeePerHour: 50.0,
      currency: "USD",
    },
    images: [
      {
        id: "img-008",
        url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Frozen Blue Taycan 4S",
      },
    ],
  },
];

export const INITIAL_BOOKINGS: DevBooking[] = [
  {
    id: "bk-001",
    bookingNumber: "RGO-2026-1001",
    customerId: "u-customer-001",
    vehicleId: "veh-001",
    startDate: new Date("2026-02-10T10:00:00Z"),
    endDate: new Date("2026-02-14T10:00:00Z"),
    totalDays: 4,
    durationType: "DAILY",
    basePrice: 300.0,
    securityDeposit: 250.0,
    taxAmount: 30.0,
    discountAmount: 0.0,
    totalAmount: 580.0,
    status: "COMPLETED",
    paymentStatus: "PAID",
    rejectionReason: null,
    cancellationReason: null,
    pickupLocation: "742 Evergreen Blvd, San Francisco",
    dropoffLocation: "742 Evergreen Blvd, San Francisco",
    notes: "Customer requested child seat",
    createdAt: new Date("2026-02-01T12:00:00Z"),
    updatedAt: new Date("2026-02-14T11:00:00Z"),
  },
  {
    id: "bk-002",
    bookingNumber: "RGO-2026-1002",
    customerId: "u-customer-002",
    vehicleId: "veh-004",
    startDate: new Date("2026-03-01T09:00:00Z"),
    endDate: new Date("2026-03-08T09:00:00Z"),
    totalDays: 7,
    durationType: "WEEKLY",
    basePrice: 190.0,
    securityDeposit: 150.0,
    taxAmount: 19.0,
    discountAmount: 55.0,
    totalAmount: 359.0,
    status: "APPROVED",
    paymentStatus: "PAID",
    rejectionReason: null,
    cancellationReason: null,
    pickupLocation: "1200 Market Street, Austin",
    dropoffLocation: "1200 Market Street, Austin",
    notes: "Visiting for conference",
    createdAt: new Date("2026-02-20T14:30:00Z"),
    updatedAt: new Date("2026-02-20T16:00:00Z"),
  },
  {
    id: "bk-003",
    bookingNumber: "RGO-2026-1003",
    customerId: "u-customer-001",
    vehicleId: "veh-002",
    startDate: new Date("2026-03-15T10:00:00Z"),
    endDate: new Date("2026-03-18T10:00:00Z"),
    totalDays: 3,
    durationType: "DAILY",
    basePrice: 330.0,
    securityDeposit: 400.0,
    taxAmount: 33.0,
    discountAmount: 0.0,
    totalAmount: 763.0,
    status: "PENDING",
    paymentStatus: "PENDING",
    rejectionReason: null,
    cancellationReason: null,
    pickupLocation: "San Francisco Int. Airport (SFO)",
    dropoffLocation: "San Francisco Int. Airport (SFO)",
    notes: "Family mountain trip",
    createdAt: new Date("2026-02-22T08:15:00Z"),
    updatedAt: new Date("2026-02-22T08:15:00Z"),
  },
];

export const INITIAL_MAINTENANCE: DevMaintenance[] = [
  {
    id: "maint-001",
    vehicleId: "veh-005",
    startDate: new Date("2026-03-10T08:00:00Z"),
    endDate: new Date("2026-03-12T18:00:00Z"),
    reason: "Scheduled 15,000 miles service and brake pad replacement",
    status: "SCHEDULED",
    notes: "Booked with authorized Honda service center",
    createdAt: new Date("2026-02-15T00:00:00Z"),
    updatedAt: new Date("2026-02-15T00:00:00Z"),
  },
];

export const INITIAL_REVIEWS: DevReview[] = [
  {
    id: "rev-001",
    bookingId: "bk-001",
    vehicleId: "veh-001",
    customerId: "u-customer-001",
    rating: 5,
    comment: "The Tesla Model 3 was in immaculate condition! Seamless pickup and return. Will definitely book again.",
    createdAt: new Date("2026-02-15T10:00:00Z"),
  },
];

export class MemoryStore {
  public users: DevUser[] = [...INITIAL_USERS];
  public agencies: DevAgency[] = [...INITIAL_AGENCIES];
  public vehicles: DevVehicle[] = [...INITIAL_VEHICLES];
  public bookings: DevBooking[] = [...INITIAL_BOOKINGS];
  public maintenance: DevMaintenance[] = [...INITIAL_MAINTENANCE];
  public reviews: DevReview[] = [...INITIAL_REVIEWS];

  reset() {
    this.users = [...INITIAL_USERS];
    this.agencies = [...INITIAL_AGENCIES];
    this.vehicles = [...INITIAL_VEHICLES];
    this.bookings = [...INITIAL_BOOKINGS];
    this.maintenance = [...INITIAL_MAINTENANCE];
    this.reviews = [...INITIAL_REVIEWS];
  }
}

export const memoryStore = new MemoryStore();
