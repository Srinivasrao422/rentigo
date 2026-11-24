export interface StoreVehicle {
  id: string;
  agencyId: string;
  vehicleNumber: string;
  brand: string;
  model: string;
  year: number;
  type: "TWO_WHEELER" | "FOUR_WHEELER";
  category: "HATCHBACK" | "SEDAN" | "SUV" | "LUXURY" | "SPORTS_BIKE" | "CRUISER" | "SCOOTER" | "STANDARD";
  fuelType: "PETROL" | "DIESEL" | "ELECTRIC" | "HYBRID";
  transmission: "MANUAL" | "AUTOMATIC";
  seatingCapacity: number;
  mileage: string | null;
  description: string;
  features: string[];
  status: "AVAILABLE" | "RENTED" | "MAINTENANCE" | "UNAVAILABLE";
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  isDeleted: boolean;
  createdAt: string;
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
  agency?: {
    id: string;
    name: string;
    city: string;
    state: string;
    contactPhone: string;
    contactEmail: string;
  };
}

export interface StoreBooking {
  id: string;
  bookingNumber: string;
  customerId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  durationType: "DAILY" | "WEEKLY" | "MONTHLY";
  basePrice: number;
  securityDeposit: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "REFUNDED" | "FAILED";
  rejectionReason: string | null;
  cancellationReason: string | null;
  pickupLocation: string;
  dropoffLocation: string;
  notes: string | null;
  createdAt: string;
  vehicle?: StoreVehicle;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

export interface StoreUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: "CUSTOMER" | "AGENCY_OWNER" | "ADMIN";
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: string;
  agency?: {
    id: string;
    name: string;
    city: string;
  };
}

export interface StoreAgency {
  id: string;
  userId: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  postalCode: string | null;
  contactPhone: string;
  contactEmail: string;
  logoUrl: string | null;
  isApproved: boolean;
  createdAt: string;
}

export const INITIAL_AGENCIES: StoreAgency[] = [
  {
    id: "ag-001",
    userId: "u-agency-001",
    name: "CityRide Motors",
    description: "Premium self-drive car and bike rentals in downtown San Francisco.",
    address: "742 Evergreen Blvd",
    city: "San Francisco",
    state: "CA",
    postalCode: "94103",
    contactPhone: "+1 (555) 234-5678",
    contactEmail: "contact@cityridemotors.com",
    logoUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=300&q=80",
    isApproved: true,
    createdAt: "2026-01-10T00:00:00Z",
  },
  {
    id: "ag-002",
    userId: "u-agency-002",
    name: "MetroWheels Hub",
    description: "Eco-friendly two-wheelers and compact SUVs for daily commutes.",
    address: "1200 Market Street",
    city: "Austin",
    state: "TX",
    postalCode: "78701",
    contactPhone: "+1 (555) 876-5432",
    contactEmail: "hello@metrowheels.com",
    logoUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80",
    isApproved: true,
    createdAt: "2026-01-15T00:00:00Z",
  },
];

export const INITIAL_USERS: StoreUser[] = [
  {
    id: "u-admin-001",
    email: "admin@rentigo.com",
    firstName: "Sarah",
    lastName: "Jenkins",
    phone: "+1 (555) 100-2000",
    role: "ADMIN",
    isActive: true,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "u-agency-001",
    email: "owner@cityridemotors.com",
    firstName: "Marcus",
    lastName: "Vance",
    phone: "+1 (555) 234-5678",
    role: "AGENCY_OWNER",
    isActive: true,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    createdAt: "2026-01-10T00:00:00Z",
    agency: {
      id: "ag-001",
      name: "CityRide Motors",
      city: "San Francisco",
    },
  },
  {
    id: "u-customer-001",
    email: "customer@example.com",
    firstName: "Alex",
    lastName: "Rider",
    phone: "+1 (555) 987-6543",
    role: "CUSTOMER",
    isActive: true,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    createdAt: "2026-01-20T00:00:00Z",
  },
];

export const INITIAL_VEHICLES: StoreVehicle[] = [
  {
    id: "veh-001",
    agencyId: "ag-001",
    vehicleNumber: "CA-7TES89",
    brand: "Tesla",
    model: "Model 3 Long Range",
    year: 2024,
    type: "FOUR_WHEELER",
    category: "SEDAN",
    fuelType: "ELECTRIC",
    transmission: "AUTOMATIC",
    seatingCapacity: 5,
    mileage: "358 miles range",
    description: "Experience the future with this premium Tesla Model 3 Long Range. Dual motor AWD, Autopilot, and all-glass roof.",
    features: ["Autopilot", "Glass Roof", "Navigation", "Bluetooth", "Heated Seats", "Backup Camera"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: "2026-01-12T00:00:00Z",
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
    agency: {
      id: "ag-001",
      name: "CityRide Motors",
      city: "San Francisco",
      state: "CA",
      contactPhone: "+1 (555) 234-5678",
      contactEmail: "contact@cityridemotors.com",
    },
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
    createdAt: "2026-01-14T00:00:00Z",
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
    agency: {
      id: "ag-001",
      name: "CityRide Motors",
      city: "San Francisco",
      state: "CA",
      contactPhone: "+1 (555) 234-5678",
      contactEmail: "contact@cityridemotors.com",
    },
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
    createdAt: "2026-01-18T00:00:00Z",
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
        caption: "Ducati Red Monster Plus",
      },
    ],
    agency: {
      id: "ag-002",
      name: "MetroWheels Hub",
      city: "Austin",
      state: "TX",
      contactPhone: "+1 (555) 876-5432",
      contactEmail: "hello@metrowheels.com",
    },
  },
  {
    id: "veh-004",
    agencyId: "ag-002",
    vehicleNumber: "TX-5CRU44",
    brand: "Honda",
    model: "Rebel 500 ABS",
    year: 2023,
    type: "TWO_WHEELER",
    category: "CRUISER",
    fuelType: "PETROL",
    transmission: "MANUAL",
    seatingCapacity: 2,
    mileage: "67 mpg",
    description: "Low seat height, punchy twin-cylinder engine, and relaxed cruiser ergonomics for city touring.",
    features: ["ABS Brakes", "LED Lighting", "Digital Gauge", "Slipper Clutch"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: "2026-01-20T00:00:00Z",
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
        caption: "Matte Black Rebel 500",
      },
    ],
    agency: {
      id: "ag-002",
      name: "MetroWheels Hub",
      city: "Austin",
      state: "TX",
      contactPhone: "+1 (555) 876-5432",
      contactEmail: "hello@metrowheels.com",
    },
  },
  {
    id: "veh-005",
    agencyId: "ag-001",
    vehicleNumber: "CA-4MER21",
    brand: "Mercedes-Benz",
    model: "C300 4MATIC",
    year: 2024,
    type: "FOUR_WHEELER",
    category: "SEDAN",
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    seatingCapacity: 5,
    mileage: "31 mpg",
    description: "Dynamic luxury executive sedan featuring 11.9-inch portrait touchscreen, ambient lighting, and AMG styling.",
    features: ["MBUX Voice Assistant", "Ambient Lighting 64 Colors", "Heated Front Seats", "Wireless Charging", "Blind Spot Assist"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: "2026-01-22T00:00:00Z",
    pricing: {
      dailyRate: 85.0,
      weeklyRate: 510.0,
      monthlyRate: 1850.0,
      securityDeposit: 350.0,
      lateFeePerHour: 25.0,
      currency: "USD",
    },
    images: [
      {
        id: "img-006",
        url: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Mercedes C300 Obsidian Black",
      },
    ],
    agency: {
      id: "ag-001",
      name: "CityRide Motors",
      city: "San Francisco",
      state: "CA",
      contactPhone: "+1 (555) 234-5678",
      contactEmail: "contact@cityridemotors.com",
    },
  },
  {
    id: "veh-006",
    agencyId: "ag-002",
    vehicleNumber: "TX-7ROY11",
    brand: "Royal Enfield",
    model: "Hunter 350",
    year: 2023,
    type: "TWO_WHEELER",
    category: "STANDARD",
    fuelType: "PETROL",
    transmission: "MANUAL",
    seatingCapacity: 2,
    mileage: "75 mpg",
    description: "Retro-modern roadster with nimble geometry, upright riding posture, and unmistakable J-series exhaust thump.",
    features: ["Dual Channel ABS", "Digi-Analog Cluster", "USB Charging Port", "Tubeless Tyres"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: "2026-01-25T00:00:00Z",
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
    agency: {
      id: "ag-002",
      name: "MetroWheels Hub",
      city: "Austin",
      state: "TX",
      contactPhone: "+1 (555) 876-5432",
      contactEmail: "hello@metrowheels.com",
    },
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
    createdAt: "2026-02-01T00:00:00Z",
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
    agency: {
      id: "ag-001",
      name: "CityRide Motors",
      city: "San Francisco",
      state: "CA",
      contactPhone: "+1 (555) 234-5678",
      contactEmail: "contact@cityridemotors.com",
    },
  },
];

export const INITIAL_BOOKINGS: StoreBooking[] = [
  {
    id: "bk-001",
    bookingNumber: "RGO-2026-1001",
    customerId: "u-customer-001",
    vehicleId: "veh-001",
    startDate: "2026-02-10T10:00:00Z",
    endDate: "2026-02-14T10:00:00Z",
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
    createdAt: "2026-02-01T12:00:00Z",
  },
  {
    id: "bk-002",
    bookingNumber: "RGO-2026-1002",
    customerId: "u-customer-001",
    vehicleId: "veh-004",
    startDate: "2026-03-01T09:00:00Z",
    endDate: "2026-03-08T09:00:00Z",
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
    createdAt: "2026-02-20T14:30:00Z",
  },
  {
    id: "bk-003",
    bookingNumber: "RGO-2026-1003",
    customerId: "u-customer-001",
    vehicleId: "veh-002",
    startDate: "2026-03-15T10:00:00Z",
    endDate: "2026-03-18T10:00:00Z",
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
    createdAt: "2026-02-22T08:15:00Z",
  },
];

class MemoryStore {
  public users: StoreUser[] = [...INITIAL_USERS];
  public agencies: StoreAgency[] = [...INITIAL_AGENCIES];
  public vehicles: StoreVehicle[] = [...INITIAL_VEHICLES];
  public bookings: StoreBooking[] = [...INITIAL_BOOKINGS];
}

declare global {
  var __rentigoStore: MemoryStore | undefined;
}

export const serverStore = global.__rentigoStore || (global.__rentigoStore = new MemoryStore());
