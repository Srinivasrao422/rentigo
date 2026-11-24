import { PrismaClient, UserRole, VehicleType, VehicleCategory, FuelType, Transmission, VehicleStatus, ApprovalStatus, BookingStatus, PaymentStatus, DurationType, MaintenanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting RentiGo Database Seeding...");

  // 1. Clean existing records in reverse dependency order
  await prisma.review.deleteMany();
  await prisma.maintenanceBlock.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.vehicleImage.deleteMany();
  await prisma.pricing.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.agency.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned old database records.");

  // 2. Hash passwords
  const adminPassword = await bcrypt.hash("Admin@SecurePass2026!", 10);
  const agencyPassword = await bcrypt.hash("Agency@SecurePass2026!", 10);
  const customerPassword = await bcrypt.hash("Customer@SecurePass2026!", 10);

  // 3. Create Users
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@rentigo.com",
      password: adminPassword,
      firstName: "Sarah",
      lastName: "Jenkins",
      phone: "+1-555-0100",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const agencyUser1 = await prisma.user.create({
    data: {
      email: "owner@apexrentals.com",
      password: agencyPassword,
      firstName: "Marcus",
      lastName: "Vance",
      phone: "+1-555-0101",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      role: UserRole.AGENCY_OWNER,
      isActive: true,
      agency: {
        create: {
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
        },
      },
    },
    include: { agency: true },
  });

  const agencyUser2 = await prisma.user.create({
    data: {
      email: "contact@cityridemotors.com",
      password: agencyPassword,
      firstName: "Elena",
      lastName: "Rostova",
      phone: "+1-555-0102",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      role: UserRole.AGENCY_OWNER,
      isActive: true,
      agency: {
        create: {
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
        },
      },
    },
    include: { agency: true },
  });

  const customerUser1 = await prisma.user.create({
    data: {
      email: "alex.rider@example.com",
      password: customerPassword,
      firstName: "Alex",
      lastName: "Rider",
      phone: "+1-555-0103",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      role: UserRole.CUSTOMER,
      isActive: true,
    },
  });

  const customerUser2 = await prisma.user.create({
    data: {
      email: "maria.garcia@example.com",
      password: customerPassword,
      firstName: "Maria",
      lastName: "Garcia",
      phone: "+1-555-0104",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      role: UserRole.CUSTOMER,
      isActive: true,
    },
  });

  console.log("👤 Created initial users and agencies.");

  // 4. Create Vehicles
  const tesla = await prisma.vehicle.create({
    data: {
      agencyId: agencyUser1.agency!.id,
      vehicleNumber: "CA-7XYZ99",
      brand: "Tesla",
      model: "Model 3 Long Range",
      year: 2024,
      type: VehicleType.FOUR_WHEELER,
      category: VehicleCategory.SEDAN,
      fuelType: FuelType.ELECTRIC,
      transmission: Transmission.AUTOMATIC,
      seatingCapacity: 5,
      mileage: "358 miles range",
      description: "Whisper-quiet, autopilot-equipped electric sedan with premium sound and unmatched acceleration.",
      features: ["Autopilot", "Glass Roof", "Navigation", "Bluetooth", "Heated Seats", "Backup Camera"],
      status: VehicleStatus.AVAILABLE,
      approvalStatus: ApprovalStatus.APPROVED,
      pricing: {
        create: {
          dailyRate: 75.0,
          weeklyRate: 450.0,
          monthlyRate: 1600.0,
          securityDeposit: 250.0,
          lateFeePerHour: 20.0,
          currency: "USD",
        },
      },
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
            isPrimary: true,
            caption: "Front angle in pearl white",
          },
          {
            url: "https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=1200&q=80",
            isPrimary: false,
            caption: "Minimalist cockpit & touch display",
          },
        ],
      },
    },
  });

  const bmw = await prisma.vehicle.create({
    data: {
      agencyId: agencyUser1.agency!.id,
      vehicleNumber: "CA-9SUV12",
      brand: "BMW",
      model: "X5 xDrive40i",
      year: 2024,
      type: VehicleType.FOUR_WHEELER,
      category: VehicleCategory.SUV,
      fuelType: FuelType.HYBRID,
      transmission: Transmission.AUTOMATIC,
      seatingCapacity: 7,
      mileage: "24 mpg",
      description: "Flagship luxury SUV with panoramic sunroof, 3rd row seating, and executive leather interior.",
      features: ["AWD", "Panoramic Sunroof", "360 Camera", "Apple CarPlay", "Harman Kardon Audio", "Adaptive Cruise"],
      status: VehicleStatus.AVAILABLE,
      approvalStatus: ApprovalStatus.APPROVED,
      pricing: {
        create: {
          dailyRate: 110.0,
          weeklyRate: 650.0,
          monthlyRate: 2300.0,
          securityDeposit: 400.0,
          lateFeePerHour: 30.0,
          currency: "USD",
        },
      },
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
            isPrimary: true,
            caption: "Exterior view in Arctic Grey",
          },
        ],
      },
    },
  });

  const ducati = await prisma.vehicle.create({
    data: {
      agencyId: agencyUser2.agency!.id,
      vehicleNumber: "TX-2BIK88",
      brand: "Ducati",
      model: "Monster Plus",
      year: 2023,
      type: VehicleType.TWO_WHEELER,
      category: VehicleCategory.SPORTS_BIKE,
      fuelType: FuelType.PETROL,
      transmission: Transmission.MANUAL,
      seatingCapacity: 2,
      mileage: "45 mpg",
      description: "Pure Italian thrill. Lightweight, agile, and equipped with cornering ABS and quick shifter.",
      features: ["Quick Shifter", "Cornering ABS", "TFT Display", "Riding Modes", "Ducati Wheelie Control"],
      status: VehicleStatus.AVAILABLE,
      approvalStatus: ApprovalStatus.APPROVED,
      pricing: {
        create: {
          dailyRate: 65.0,
          weeklyRate: 380.0,
          monthlyRate: 1300.0,
          securityDeposit: 300.0,
          lateFeePerHour: 15.0,
          currency: "USD",
        },
      },
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80",
            isPrimary: true,
            caption: "Ducati Red Monster in full profile",
          },
        ],
      },
    },
  });

  const vespa = await prisma.vehicle.create({
    data: {
      agencyId: agencyUser2.agency!.id,
      vehicleNumber: "TX-5VES33",
      brand: "Vespa",
      model: "GTS Super 300",
      year: 2024,
      type: VehicleType.TWO_WHEELER,
      category: VehicleCategory.SCOOTER,
      fuelType: FuelType.PETROL,
      transmission: Transmission.AUTOMATIC,
      seatingCapacity: 2,
      mileage: "70 mpg",
      description: "Iconic Italian urban cruiser. Effortless twist-and-go throttle with helmet storage under seat.",
      features: ["Under-seat Storage", "USB Port", "ABS", "LED Headlights", "Passenger Footrests"],
      status: VehicleStatus.AVAILABLE,
      approvalStatus: ApprovalStatus.APPROVED,
      pricing: {
        create: {
          dailyRate: 35.0,
          weeklyRate: 190.0,
          monthlyRate: 650.0,
          securityDeposit: 150.0,
          lateFeePerHour: 10.0,
          currency: "USD",
        },
      },
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80",
            isPrimary: true,
            caption: "Vintage Olive Vespa GTS",
          },
        ],
      },
    },
  });

  console.log("🚗 Created vehicles with pricing and images.");

  // 5. Create Bookings
  const booking1 = await prisma.booking.create({
    data: {
      bookingNumber: "RGO-2026-1001",
      customerId: customerUser1.id,
      vehicleId: tesla.id,
      startDate: new Date("2026-02-10T10:00:00Z"),
      endDate: new Date("2026-02-14T10:00:00Z"),
      totalDays: 4,
      durationType: DurationType.DAILY,
      basePrice: 300.0,
      securityDeposit: 250.0,
      taxAmount: 30.0,
      discountAmount: 0.0,
      totalAmount: 580.0,
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      pickupLocation: "742 Evergreen Blvd, San Francisco",
      dropoffLocation: "742 Evergreen Blvd, San Francisco",
      notes: "Customer requested child seat",
    },
  });

  await prisma.review.create({
    data: {
      bookingId: booking1.id,
      vehicleId: tesla.id,
      customerId: customerUser1.id,
      rating: 5,
      comment: "The Tesla Model 3 was in immaculate condition! Seamless pickup and return. Will definitely book again.",
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
