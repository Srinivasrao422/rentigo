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
  comment: string;
  createdAt: Date;
}

const DEFAULT_HASH = bcrypt.hashSync("Admin@12345", 10);
const AGENCY_HASH = bcrypt.hashSync("Agency@12345", 10);
const CUSTOMER_HASH = bcrypt.hashSync("Customer@12345", 10);

export const INITIAL_USERS: DevUser[] = [
  {
    id: "u-admin-001",
    email: "admin@rentigo.com",
    passwordHash: DEFAULT_HASH,
    firstName: "Priya",
    lastName: "Sharma",
    phone: "+91 98100 22334",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
    role: "ADMIN",
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  },
  {
    id: "u-agency-001",
    email: "owner@cityridemotors.com",
    passwordHash: AGENCY_HASH,
    firstName: "Rajesh",
    lastName: "Nair",
    phone: "+91 98450 12345",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
    role: "AGENCY_OWNER",
    isActive: true,
    createdAt: new Date("2026-01-10T00:00:00Z"),
    updatedAt: new Date("2026-01-10T00:00:00Z"),
  },
  {
    id: "u-customer-001",
    email: "customer@example.com",
    passwordHash: CUSTOMER_HASH,
    firstName: "Rahul",
    lastName: "Verma",
    phone: "+91 99887 76655",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80",
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
    name: "DriveBliss India",
    description: "Premium self-drive cars, electric SUVs, and modern bikes in Bengaluru tech corridor.",
    address: "142, 100 Feet Road, Indiranagar",
    city: "Bengaluru",
    state: "KA",
    postalCode: "560038",
    contactPhone: "+91 98450 12345",
    contactEmail: "contact@drivebliss.in",
    logoUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=300&q=80",
    isApproved: true,
    createdAt: new Date("2026-01-10T00:00:00Z"),
    updatedAt: new Date("2026-01-10T00:00:00Z"),
  },
  {
    id: "ag-002",
    userId: "u-agency-002",
    name: "Goa Cruise & Rides",
    description: "Beach cruisers, open-top 4x4 Thar off-roaders, and Activa scooters in North & South Goa.",
    address: "Calangute - Baga Main Road",
    city: "Goa",
    state: "GA",
    postalCode: "403516",
    contactPhone: "+91 98221 67890",
    contactEmail: "bookings@goacruiserides.in",
    logoUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80",
    isApproved: true,
    createdAt: new Date("2026-01-15T00:00:00Z"),
    updatedAt: new Date("2026-01-15T00:00:00Z"),
  },
  {
    id: "ag-003",
    userId: "u-agency-003",
    name: "MetroWheelz Hub",
    description: "Corporate and leisure self-drive mobility solutions across Mumbai and Pune expressway.",
    address: "Terminal 2 Arrival Plaza, CSMIA Airport",
    city: "Mumbai",
    state: "MH",
    postalCode: "400099",
    contactPhone: "+91 98200 45678",
    contactEmail: "fleet@metrowheelz.in",
    logoUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80",
    isApproved: true,
    createdAt: new Date("2026-01-18T00:00:00Z"),
    updatedAt: new Date("2026-01-18T00:00:00Z"),
  },
  {
    id: "ag-004",
    userId: "u-agency-004",
    name: "Capital Fleet Solutions",
    description: "Executive sedans and hybrid family tourers for Delhi NCR, Noida, and Gurgaon.",
    address: "Block A, Connaught Place",
    city: "Delhi NCR",
    state: "DL",
    postalCode: "110001",
    contactPhone: "+91 98110 54321",
    contactEmail: "contact@capitalfleet.in",
    logoUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80",
    isApproved: true,
    createdAt: new Date("2026-01-20T00:00:00Z"),
    updatedAt: new Date("2026-01-20T00:00:00Z"),
  },
];

export const INITIAL_VEHICLES: DevVehicle[] = [
  // 1. Mahindra Thar 4x4
  {
    id: "veh-001",
    agencyId: "ag-002",
    vehicleNumber: "GA-03-TR-4400",
    brand: "Mahindra",
    model: "Thar LX 4x4 Hard Top",
    year: 2024,
    type: "FOUR_WHEELER",
    category: "SUV",
    fuelType: "DIESEL",
    transmission: "MANUAL",
    seatingCapacity: 4,
    mileage: "15 km/l",
    description: "Iconic Indian 4x4 with shift-on-the-fly four-wheel drive, 18-inch deep silver alloys, roll cage, and water-resistant touchscreen.",
    features: ["4x4 Low/High Range", "Roll Cage", "Apple CarPlay & Android Auto", "Tire Pressure Monitor", "Water-Resistant Dashboard", "Hill Hold & Descent"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-01-12T00:00:00Z"),
    updatedAt: new Date("2026-01-12T00:00:00Z"),
    pricing: {
      dailyRate: 3800,
      weeklyRate: 22800,
      monthlyRate: 75000,
      securityDeposit: 8000,
      lateFeePerHour: 300,
      currency: "INR",
    },
    images: [
      {
        id: "img-001",
        url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Mahindra Thar Red Rage in rugged off-road stance",
      },
    ],
  },
  // 2. Tata Nexon EV
  {
    id: "veh-002",
    agencyId: "ag-001",
    vehicleNumber: "KA-03-EV-9999",
    brand: "Tata",
    model: "Nexon EV Long Range Empowered+",
    year: 2024,
    type: "FOUR_WHEELER",
    category: "SUV",
    fuelType: "ELECTRIC",
    transmission: "AUTOMATIC",
    seatingCapacity: 5,
    mileage: "465 km ARAI range",
    description: "India's best-selling electric SUV with fast charging, 10.25-inch cinematic touchscreen, 360-degree camera, and smart digital shifter.",
    features: ["465 km Range", "V2V & V2L Charging", "10.25-inch Touchscreen", "Ventilated Front Seats", "360 Surround View", "Air Purifier"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-01-14T00:00:00Z"),
    updatedAt: new Date("2026-01-14T00:00:00Z"),
    pricing: {
      dailyRate: 2600,
      weeklyRate: 15600,
      monthlyRate: 52000,
      securityDeposit: 6000,
      lateFeePerHour: 200,
      currency: "INR",
    },
    images: [
      {
        id: "img-002",
        url: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Tata Nexon EV Pristine White with bi-LED headlamps",
      },
    ],
  },
  // 3. Royal Enfield Classic 350
  {
    id: "veh-003",
    agencyId: "ag-001",
    vehicleNumber: "KA-01-EQ-3500",
    brand: "Royal Enfield",
    model: "Classic 350 Dark Stealth",
    year: 2024,
    type: "TWO_WHEELER",
    category: "CRUISER",
    fuelType: "PETROL",
    transmission: "MANUAL",
    seatingCapacity: 2,
    mileage: "37 km/l",
    description: "Timeless retro cruiser powered by the ultra-smooth 349cc J-series engine. Matte black finish, dual-channel ABS, and signature exhaust thump.",
    features: ["Dual Channel ABS", "Tripper Navigation Pod", "J-Series Counterbalanced Engine", "Tubeless Alloy Wheels", "USB Phone Charger"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-01-18T00:00:00Z"),
    updatedAt: new Date("2026-01-18T00:00:00Z"),
    pricing: {
      dailyRate: 1200,
      weeklyRate: 7200,
      monthlyRate: 24000,
      securityDeposit: 3000,
      lateFeePerHour: 100,
      currency: "INR",
    },
    images: [
      {
        id: "img-003",
        url: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Royal Enfield Classic 350 Stealth Black",
      },
    ],
  },
  // 4. Honda Activa 6G
  {
    id: "veh-004",
    agencyId: "ag-003",
    vehicleNumber: "MH-02-BZ-1090",
    brand: "Honda",
    model: "Activa 6G Deluxe",
    year: 2024,
    type: "TWO_WHEELER",
    category: "SCOOTER",
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    seatingCapacity: 2,
    mileage: "55 km/l",
    description: "India's undisputed king of daily city commuting. Telescopic front suspension, external fuel cap, silent ACG starter, and unmatched reliability.",
    features: ["Silent ACG Starter", "External Fuel Fill", "Telescopic Front Suspension", "Combi Brake System (CBS)", "LED Headlamp"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-01-20T00:00:00Z"),
    updatedAt: new Date("2026-01-20T00:00:00Z"),
    pricing: {
      dailyRate: 450,
      weeklyRate: 2600,
      monthlyRate: 8500,
      securityDeposit: 1500,
      lateFeePerHour: 50,
      currency: "INR",
    },
    images: [
      {
        id: "img-004",
        url: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Honda Activa 6G in Matte Axis Grey",
      },
    ],
  },
  // 5. Hyundai Creta
  {
    id: "veh-005",
    agencyId: "ag-004",
    vehicleNumber: "DL-01-CR-2024",
    brand: "Hyundai",
    model: "Creta SX(O) Turbo DCT",
    year: 2024,
    type: "FOUR_WHEELER",
    category: "SUV",
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    seatingCapacity: 5,
    mileage: "18 km/l",
    description: "Premium mid-size SUV with Level-2 ADAS autonomous safety, panoramic sunroof, Bose 8-speaker audio, and ventilated leather seats.",
    features: ["Level-2 ADAS", "Panoramic Sunroof", "Bose 8-Speaker Audio", "Ventilated Front Seats", "Dual Zone Climate Control", "Paddle Shifters"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-01-22T00:00:00Z"),
    updatedAt: new Date("2026-01-22T00:00:00Z"),
    pricing: {
      dailyRate: 2800,
      weeklyRate: 16800,
      monthlyRate: 56000,
      securityDeposit: 7000,
      lateFeePerHour: 250,
      currency: "INR",
    },
    images: [
      {
        id: "img-005",
        url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Hyundai Creta in Titan Grey Matte",
      },
    ],
  },
  // 6. Toyota Innova Crysta
  {
    id: "veh-006",
    agencyId: "ag-003",
    vehicleNumber: "MH-01-TC-7777",
    brand: "Toyota",
    model: "Innova Crysta 2.4 VX 7-Seater",
    year: 2023,
    type: "FOUR_WHEELER",
    category: "SUV",
    fuelType: "DIESEL",
    transmission: "MANUAL",
    seatingCapacity: 7,
    mileage: "15.6 km/l",
    description: "The gold standard of long-distance family travel in India. Plush middle-row captain seats, bulletproof 2.4L D-4D diesel engine, and cavernous boot space.",
    features: ["Captain Seats with Armrests", "Eco & Power Drive Modes", "7 Airbags Standard", "Rear Automatic AC Blower", "One-Touch Tumble Seats"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-01-25T00:00:00Z"),
    updatedAt: new Date("2026-01-25T00:00:00Z"),
    pricing: {
      dailyRate: 3500,
      weeklyRate: 21000,
      monthlyRate: 70000,
      securityDeposit: 8000,
      lateFeePerHour: 300,
      currency: "INR",
    },
    images: [
      {
        id: "img-006",
        url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Toyota Innova Crysta in Super White",
      },
    ],
  },
  // 7. Ather 450X
  {
    id: "veh-007",
    agencyId: "ag-001",
    vehicleNumber: "KA-05-EV-4501",
    brand: "Ather",
    model: "450X Gen 3 Space Grey",
    year: 2024,
    type: "TWO_WHEELER",
    category: "SCOOTER",
    fuelType: "ELECTRIC",
    transmission: "AUTOMATIC",
    seatingCapacity: 2,
    mileage: "150 km TrueRange",
    description: "Hyper-smart electric scooter built in Bengaluru. Warp mode delivers 0 to 40 km/h in 3.3 seconds, with onboard Google Maps and live tire pressure sensors.",
    features: ["Warp Mode (0-40 in 3.3s)", "Google Maps Onboard Dashboard", "Regenerative Braking", "Reverse Park Assist", "Auto-Hold Hill Stop", "Over-the-Air Updates"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-01-28T00:00:00Z"),
    updatedAt: new Date("2026-01-28T00:00:00Z"),
    pricing: {
      dailyRate: 600,
      weeklyRate: 3500,
      monthlyRate: 11500,
      securityDeposit: 2000,
      lateFeePerHour: 60,
      currency: "INR",
    },
    images: [
      {
        id: "img-007",
        url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Ather 450X Space Grey electric smart scooter",
      },
    ],
  },
  // 8. Yamaha R15 V4
  {
    id: "veh-008",
    agencyId: "ag-004",
    vehicleNumber: "DL-04-RS-1550",
    brand: "Yamaha",
    model: "YZF-R15 V4 Racing Blue",
    year: 2024,
    type: "TWO_WHEELER",
    category: "SPORTS_BIKE",
    fuelType: "PETROL",
    transmission: "MANUAL",
    seatingCapacity: 2,
    mileage: "45 km/l",
    description: "Aerodynamic track-bred supersport machine. Variable Valve Actuation (VVA), upside-down front forks, quickshifter, and aggressive clip-on posture.",
    features: ["Quickshifter (Up-shift)", "Variable Valve Actuation (VVA)", "Traction Control System", "Dual-Channel ABS", "USD Gold Front Forks", "Track & Street Display Modes"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-01-30T00:00:00Z"),
    updatedAt: new Date("2026-01-30T00:00:00Z"),
    pricing: {
      dailyRate: 1500,
      weeklyRate: 9000,
      monthlyRate: 30000,
      securityDeposit: 4000,
      lateFeePerHour: 150,
      currency: "INR",
    },
    images: [
      {
        id: "img-008",
        url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Yamaha YZF-R15 V4 in Metallic Racing Blue",
      },
    ],
  },
  // 9. Maruti Suzuki Swift
  {
    id: "veh-009",
    agencyId: "ag-003",
    vehicleNumber: "PN-12-SW-5500",
    brand: "Maruti Suzuki",
    model: "Swift ZXi+ Dual Tone AMT",
    year: 2024,
    type: "FOUR_WHEELER",
    category: "HATCHBACK",
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    seatingCapacity: 5,
    mileage: "25.75 km/l",
    description: "Peppy, ultra-fuel-efficient city hatchback. All-new Z-series 1.2L engine, 6 airbags standard, 9-inch SmartPlay Pro+ screen, and cruise control.",
    features: ["6 Airbags Standard", "25.75 km/l Mileage", "9-inch Touchscreen", "Cruise Control", "LED Projector Headlamps", "Rear View Camera with Guidelines"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-02-01T00:00:00Z"),
    updatedAt: new Date("2026-02-01T00:00:00Z"),
    pricing: {
      dailyRate: 1400,
      weeklyRate: 8400,
      monthlyRate: 28000,
      securityDeposit: 4000,
      lateFeePerHour: 150,
      currency: "INR",
    },
    images: [
      {
        id: "img-009",
        url: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Maruti Suzuki Swift in Sizzling Red with Midnight Black Roof",
      },
    ],
  },
  // 10. Mahindra Scorpio-N
  {
    id: "veh-010",
    agencyId: "ag-004",
    vehicleNumber: "RJ-14-SN-8800",
    brand: "Mahindra",
    model: "Scorpio-N Z8L 4x4",
    year: 2024,
    type: "FOUR_WHEELER",
    category: "SUV",
    fuelType: "DIESEL",
    transmission: "AUTOMATIC",
    seatingCapacity: 7,
    mileage: "16 km/l",
    description: "The 'Big Daddy of SUVs'. Command driving position, 4XPLOR intelligent terrain response system, Sony 12-speaker 3D sound, and dual-zone climate control.",
    features: ["4XPLOR Terrain Modes", "Sony 12-Speaker 3D Audio", "Alexa Built-in", "Electric Sunroof", "Wireless Phone Charging", "Front & Rear Parking Camera"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-02-02T00:00:00Z"),
    updatedAt: new Date("2026-02-02T00:00:00Z"),
    pricing: {
      dailyRate: 3600,
      weeklyRate: 21600,
      monthlyRate: 72000,
      securityDeposit: 8000,
      lateFeePerHour: 300,
      currency: "INR",
    },
    images: [
      {
        id: "img-010",
        url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Mahindra Scorpio-N in Deep Forest metallic",
      },
    ],
  },
  // 11. KTM Duke 390
  {
    id: "veh-011",
    agencyId: "ag-002",
    vehicleNumber: "GA-07-KT-3909",
    brand: "KTM",
    model: "390 Duke Electric Orange",
    year: 2024,
    type: "TWO_WHEELER",
    category: "SPORTS_BIKE",
    fuelType: "PETROL",
    transmission: "MANUAL",
    seatingCapacity: 2,
    mileage: "30 km/l",
    description: "The Corner Rocket. 44.8 HP 399cc engine, launch control, Supermoto ABS mode, Quickshifter+, and 5-inch bonded glass TFT display.",
    features: ["Launch Control", "Quickshifter+ (Bi-directional)", "Cornering Traction Control", "Supermoto ABS Mode", "5-inch Bonded TFT Glass Screen"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-02-03T00:00:00Z"),
    updatedAt: new Date("2026-02-03T00:00:00Z"),
    pricing: {
      dailyRate: 1800,
      weeklyRate: 10800,
      monthlyRate: 36000,
      securityDeposit: 5000,
      lateFeePerHour: 200,
      currency: "INR",
    },
    images: [
      {
        id: "img-011",
        url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "KTM 390 Duke in aggressive Electronic Orange",
      },
    ],
  },
  // 12. Honda City Hybrid
  {
    id: "veh-012",
    agencyId: "ag-001",
    vehicleNumber: "TS-07-HC-5005",
    brand: "Honda",
    model: "City ZX e:HEV Strong Hybrid",
    year: 2024,
    type: "FOUR_WHEELER",
    category: "SEDAN",
    fuelType: "HYBRID",
    transmission: "AUTOMATIC",
    seatingCapacity: 5,
    mileage: "27.13 km/l",
    description: "Self-charging dual-motor strong hybrid sedan. Outstanding fuel efficiency, Honda SENSING autonomous safety, LaneWatch camera, and silent electric EV drive mode.",
    features: ["Dual Motor Self-Charging Hybrid", "27.13 km/l Mileage", "Honda SENSING ADAS Suite", "LaneWatch Camera", "Electric Sunroof", "Walk-Away Auto Lock"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-02-04T00:00:00Z"),
    updatedAt: new Date("2026-02-04T00:00:00Z"),
    pricing: {
      dailyRate: 2400,
      weeklyRate: 14400,
      monthlyRate: 48000,
      securityDeposit: 6000,
      lateFeePerHour: 200,
      currency: "INR",
    },
    images: [
      {
        id: "img-012",
        url: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Honda City e:HEV in Obsidian Blue Pearl",
      },
    ],
  },
  // 13. TVS Jupiter 125
  {
    id: "veh-013",
    agencyId: "ag-001",
    vehicleNumber: "TS-09-JU-1250",
    brand: "TVS",
    model: "Jupiter 125 Disc SmartXonnect",
    year: 2023,
    type: "TWO_WHEELER",
    category: "SCOOTER",
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    seatingCapacity: 2,
    mileage: "52 km/l",
    description: "India's most spacious 125cc family scooter. Industry-first 33L under-seat storage fits two full-face helmets, external front fuel lid, and Bluetooth navigation.",
    features: ["33L Huge Under-Seat Storage", "External Front Fuel Fill", "Bluetooth Turn-by-Turn Navigation", "Front Disc Brake", "IntelliGO Engine Auto Cut-Off"],
    status: "AVAILABLE",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-02-05T00:00:00Z"),
    updatedAt: new Date("2026-02-05T00:00:00Z"),
    pricing: {
      dailyRate: 420,
      weeklyRate: 2400,
      monthlyRate: 7800,
      securityDeposit: 1200,
      lateFeePerHour: 40,
      currency: "INR",
    },
    images: [
      {
        id: "img-013",
        url: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "TVS Jupiter 125 in Dawn Orange",
      },
    ],
  },
  // 14. Porsche Taycan 4S (Pending Admin Approval)
  {
    id: "veh-014",
    agencyId: "ag-003",
    vehicleNumber: "MH-04-PT-9000",
    brand: "Porsche",
    model: "Taycan 4S Cross Turismo",
    year: 2024,
    type: "FOUR_WHEELER",
    category: "LUXURY",
    fuelType: "ELECTRIC",
    transmission: "AUTOMATIC",
    seatingCapacity: 4,
    mileage: "450 km range",
    description: "Ultra-luxury electric grand tourer in Mumbai. 522 hp with launch control, 0-100 in 4.0s, adaptive air suspension with Gravel Mode, and curved digital cockpit.",
    features: ["522 HP Overboost Launch Control", "Gravel Off-Road Driving Mode", "Adaptive Air Suspension", "Burmester 3D High-End Sound", "16.8-inch Curved Instrument Cluster"],
    status: "AVAILABLE",
    approvalStatus: "PENDING",
    rejectionReason: null,
    isDeleted: false,
    createdAt: new Date("2026-02-06T00:00:00Z"),
    updatedAt: new Date("2026-02-06T00:00:00Z"),
    pricing: {
      dailyRate: 18000,
      weeklyRate: 108000,
      monthlyRate: 350000,
      securityDeposit: 40000,
      lateFeePerHour: 1500,
      currency: "INR",
    },
    images: [
      {
        id: "img-014",
        url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
        caption: "Porsche Taycan 4S in Frozen Blue Metallic",
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
    basePrice: 15200,
    securityDeposit: 8000,
    taxAmount: 1520,
    discountAmount: 0,
    totalAmount: 24720,
    status: "COMPLETED",
    paymentStatus: "PAID",
    rejectionReason: null,
    cancellationReason: null,
    pickupLocation: "Calangute Beach Road, North Goa",
    dropoffLocation: "Calangute Beach Road, North Goa",
    notes: "Customer requested off-road tire pressure kit",
    createdAt: new Date("2026-02-01T12:00:00Z"),
    updatedAt: new Date("2026-02-14T11:00:00Z"),
  },
  {
    id: "bk-002",
    bookingNumber: "RGO-2026-1002",
    customerId: "u-customer-001",
    vehicleId: "veh-003",
    startDate: new Date("2026-03-01T09:00:00Z"),
    endDate: new Date("2026-03-08T09:00:00Z"),
    totalDays: 7,
    durationType: "WEEKLY",
    basePrice: 7200,
    securityDeposit: 3000,
    taxAmount: 720,
    discountAmount: 1200,
    totalAmount: 10920,
    status: "APPROVED",
    paymentStatus: "PAID",
    rejectionReason: null,
    cancellationReason: null,
    pickupLocation: "100 Feet Road, Indiranagar, Bengaluru",
    dropoffLocation: "100 Feet Road, Indiranagar, Bengaluru",
    notes: "Solo road trip to Coorg and Ooty",
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
    basePrice: 7800,
    securityDeposit: 6000,
    taxAmount: 780,
    discountAmount: 0,
    totalAmount: 14580,
    status: "PENDING",
    paymentStatus: "PENDING",
    rejectionReason: null,
    cancellationReason: null,
    pickupLocation: "KIA Bengaluru Airport (BLR)",
    dropoffLocation: "KIA Bengaluru Airport (BLR)",
    notes: "Family EV road trip around Mysuru",
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
    reason: "Scheduled 10,000 km periodic service and brake pad inspection",
    status: "SCHEDULED",
    notes: "Booked with Hyundai Authorized Service Center, Connaught Place",
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
    comment: "Renting the Mahindra Thar in Goa was the best experience! Vehicle was in mint condition, clean, and the 4x4 handled beach roads effortlessly.",
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
