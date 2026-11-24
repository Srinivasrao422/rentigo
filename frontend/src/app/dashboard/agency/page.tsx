"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Vehicle, Booking, VehicleStatus } from "../../../types";
import { apiRequest } from "../../../lib/api";
import { useAuthStore } from "../../../store/authStore";
import { formatCurrency, formatDate, getStatusBadge } from "../../../lib/utils";
import { Button } from "../../../components/ui/Button";
import { Dialog } from "../../../components/ui/Dialog";
import {
  Building2,
  Car,
  Bike,
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  Wrench,
  Clock,
  DollarSign,
  TrendingUp,
  Percent,
  MapPin,
  AlertTriangle,
  PlayCircle,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export default function AgencyDashboardPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  const [stats, setStats] = useState<any>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active tab: "REQUESTS" | "FLEET" | "ACTIVE_RENTALS"
  const [activeTab, setActiveTab] = useState<string>("REQUESTS");

  // Add Vehicle Modal State
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicleNumber: "",
    brand: "",
    model: "",
    year: 2024,
    type: "FOUR_WHEELER" as const,
    category: "SEDAN" as const,
    fuelType: "PETROL" as const,
    transmission: "AUTOMATIC" as const,
    seatingCapacity: 5,
    mileage: "30 mpg",
    description: "",
    features: ["Air Conditioning", "Bluetooth", "Backup Camera"],
    pricing: {
      dailyRate: 60,
      weeklyRate: 360,
      monthlyRate: 1250,
      securityDeposit: 200,
      lateFeePerHour: 15,
    },
    imageUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
  });
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);

  // Rejection modal
  const [rejectBookingId, setRejectBookingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Maintenance modal
  const [maintVehicleId, setMaintVehicleId] = useState<string | null>(null);
  const [maintStart, setMaintStart] = useState("");
  const [maintEnd, setMaintEnd] = useState("");
  const [maintReason, setMaintReason] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsData, vehiclesData, bookingsData] = await Promise.all([
        apiRequest("/agencies/dashboard", { requiresAuth: true }),
        apiRequest("/agencies/vehicles", { requiresAuth: true }),
        apiRequest("/bookings/agency", { requiresAuth: true }),
      ]);

      setStats(statsData);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && (!user || user.role !== "AGENCY_OWNER" && user.role !== "ADMIN")) {
      toast.error("Access denied: Rental Agency permissions required");
      router.push("/login");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, isInitialized]);

  const handleUpdateBookingStatus = async (
    bookingId: string,
    status: string,
    reason?: string
  ) => {
    try {
      await apiRequest(`/bookings/${bookingId}/status`, {
        method: "PATCH",
        requiresAuth: true,
        body: JSON.stringify({ status, reason }),
      });

      toast.success(`Booking status changed to ${status}`);
      setRejectBookingId(null);
      setRejectReason("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update booking status");
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingVehicle(true);

    try {
      await apiRequest("/vehicles", {
        method: "POST",
        requiresAuth: true,
        body: JSON.stringify({
          ...newVehicle,
          images: newVehicle.imageUrl
            ? [{ url: newVehicle.imageUrl, isPrimary: true }]
            : undefined,
        }),
      });

      toast.success("Vehicle added to your agency fleet!");
      setIsAddVehicleOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add vehicle");
    } finally {
      setIsSubmittingVehicle(false);
    }
  };

  const handleToggleVehicleStatus = async (vehicleId: string, currentStatus: VehicleStatus) => {
    const nextStatus: VehicleStatus =
      currentStatus === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";

    try {
      await apiRequest(`/vehicles/${vehicleId}/status`, {
        method: "PATCH",
        requiresAuth: true,
        body: JSON.stringify({ status: nextStatus }),
      });

      toast.success(`Vehicle marked as ${nextStatus}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleScheduleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintVehicleId) return;

    try {
      await apiRequest(`/vehicles/${maintVehicleId}/maintenance`, {
        method: "POST",
        requiresAuth: true,
        body: JSON.stringify({
          startDate: new Date(`${maintStart}T08:00:00Z`).toISOString(),
          endDate: new Date(`${maintEnd}T18:00:00Z`).toISOString(),
          reason: maintReason,
        }),
      });

      toast.success("Maintenance dates scheduled & blocked from customer booking!");
      setMaintVehicleId(null);
      setMaintStart("");
      setMaintEnd("");
      setMaintReason("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule maintenance");
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === "PENDING");
  const activeRentals = bookings.filter((b) => b.status === "ACTIVE" || b.status === "APPROVED");

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-black text-gray-950 dark:text-white">
              Agency Fleet Operations
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Manage your fleet availability, approve pending customer requests, and track revenue.
          </p>
        </div>

        <Button
          onClick={() => setIsAddVehicleOpen(true)}
          className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Add New Vehicle</span>
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Fleet Size</span>
            <Car className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {stats?.totalVehicles ?? vehicles.length}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Total active vehicles</div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Requests</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {pendingBookings.length}
          </div>
          <div className="text-[10px] text-amber-600/80 mt-1">Requires approval</div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Rentals</span>
            <PlayCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {stats?.activeRentals ?? activeRentals.length}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Vehicles currently out</div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Utilization</span>
            <Percent className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600">
            {stats?.utilizationRate ?? 40}%
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Fleet utilization rate</div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {formatCurrency(stats?.totalRevenue ?? 1250)}
          </div>
          <div className="text-[10px] text-emerald-600 mt-1 font-semibold">Processed rentals</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab("REQUESTS")}
          className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all relative ${
            activeTab === "REQUESTS"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
          }`}
        >
          <span>Pending Booking Requests</span>
          {pendingBookings.length > 0 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.2 text-[10px] text-white">
              {pendingBookings.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("FLEET")}
          className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all relative ${
            activeTab === "FLEET"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
          }`}
        >
          <span>Fleet Inventory ({vehicles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("ACTIVE_RENTALS")}
          className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all relative ${
            activeTab === "ACTIVE_RENTALS"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
          }`}
        >
          <span>Active & Confirmed Rentals ({activeRentals.length})</span>
        </button>
      </div>

      {/* Tab 1: Pending Booking Requests Queue */}
      {activeTab === "REQUESTS" && (
        <div className="space-y-4">
          {pendingBookings.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                All caught up! No pending requests.
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                New customer rental requests will appear here for one-click approval.
              </p>
            </div>
          ) : (
            pendingBookings.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm dark:border-amber-900/50 dark:bg-gray-900"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-900 dark:text-white bg-amber-50 dark:bg-amber-950/50 text-amber-800 px-2 py-0.5 rounded">
                        #{b.bookingNumber}
                      </span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {b.customer?.firstName} {b.customer?.lastName}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({b.customer?.email} • {b.customer?.phone || "No phone"})
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      Vehicle: <strong>{b.vehicle?.brand} {b.vehicle?.model}</strong> | Dates: <strong>{formatDate(b.startDate)} &rarr; {formatDate(b.endDate)}</strong> ({b.totalDays} Days)
                    </div>

                    <div className="text-[11px] text-gray-500">
                      Pickup/Dropoff: {b.pickupLocation} | Estimated Total: <strong className="text-blue-600">{formatCurrency(b.totalAmount)}</strong>
                    </div>

                    {b.notes && (
                      <div className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded-lg mt-1 dark:bg-gray-800">
                        Customer note: "{b.notes}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRejectBookingId(b.id)}
                      className="text-xs"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      <span>Reject</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateBookingStatus(b.id, "APPROVED")}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 font-bold"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      <span>Approve Request</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Fleet Inventory Table */}
      {activeTab === "FLEET" && (
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:bg-gray-800/60">
              <tr>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Type / Cat</th>
                <th className="p-4">Plate No</th>
                <th className="p-4">Daily Rate</th>
                <th className="p-4">Weekly / Monthly</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                  <td className="p-4 flex items-center gap-3">
                    <div className="h-10 w-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      <img
                        src={v.images?.[0]?.url || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=200&q=80"}
                        alt={v.model}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {v.brand} {v.model}
                      </div>
                      <div className="text-[10px] text-gray-400">{v.year}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      {v.type === "FOUR_WHEELER" ? (
                        <Car className="h-3.5 w-3.5 text-blue-500" />
                      ) : (
                        <Bike className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                      <span>{v.category.replace("_", " ")}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono font-semibold text-gray-800 dark:text-gray-200">
                    {v.vehicleNumber}
                  </td>
                  <td className="p-4 font-bold text-gray-900 dark:text-white">
                    {formatCurrency(v.pricing?.dailyRate || 0)}
                  </td>
                  <td className="p-4 text-gray-500">
                    {formatCurrency(v.pricing?.weeklyRate || 0)} / {formatCurrency(v.pricing?.monthlyRate || 0)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadge(
                        v.status
                      )}`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleToggleVehicleStatus(v.id, v.status)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      {v.status === "AVAILABLE" ? "Mark Unavailable" : "Mark Available"}
                    </button>
                    <button
                      onClick={() => setMaintVehicleId(v.id)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400"
                    >
                      Schedule Service
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Active & Confirmed Rentals */}
      {activeTab === "ACTIVE_RENTALS" && (
        <div className="space-y-4">
          {activeRentals.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
              <Car className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                No active or confirmed rentals at this moment.
              </h3>
            </div>
          ) : (
            activeRentals.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                      #{b.bookingNumber}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[10px] font-bold ${getStatusBadge(
                        b.status
                      )}`}
                    >
                      {b.status}
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {b.customer?.firstName} {b.customer?.lastName}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Vehicle: <strong>{b.vehicle?.brand} {b.vehicle?.model}</strong> | Dates: {formatDate(b.startDate)} &rarr; {formatDate(b.endDate)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Total: <strong className="text-blue-600">{formatCurrency(b.totalAmount)}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {b.status === "APPROVED" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateBookingStatus(b.id, "ACTIVE")}
                      className="text-xs bg-blue-600 hover:bg-blue-700"
                    >
                      Start Rental (Handover)
                    </Button>
                  )}
                  {b.status === "ACTIVE" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateBookingStatus(b.id, "COMPLETED")}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700"
                    >
                      Complete & Return Vehicle
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Vehicle Modal */}
      <Dialog
        isOpen={isAddVehicleOpen}
        onClose={() => setIsAddVehicleOpen(false)}
        title="Add Vehicle to Agency Fleet"
        description="Provide vehicle specifications, tiered daily/weekly/monthly pricing, and photo."
        className="max-w-2xl"
      >
        <form onSubmit={handleCreateVehicle} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Make / Brand
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tesla, Honda, Ducati, Vespa"
                value={newVehicle.brand}
                onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Model Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Model 3, Civic, Monster Plus"
                value={newVehicle.model}
                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Registration Plate
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CA-8XYZ00"
                value={newVehicle.vehicleNumber}
                onChange={(e) => setNewVehicle({ ...newVehicle, vehicleNumber: e.target.value })}
                className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Model Year
              </label>
              <input
                type="number"
                required
                min={2000}
                max={2026}
                value={newVehicle.year}
                onChange={(e) => setNewVehicle({ ...newVehicle, year: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Vehicle Type
              </label>
              <select
                value={newVehicle.type}
                onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value as any })}
                className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="FOUR_WHEELER">Four-Wheeler (Car/SUV)</option>
                <option value="TWO_WHEELER">Two-Wheeler (Bike/Scooter)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={newVehicle.category}
                onChange={(e) => setNewVehicle({ ...newVehicle, category: e.target.value as any })}
                className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="SEDAN">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="HATCHBACK">Hatchback</option>
                <option value="LUXURY">Luxury</option>
                <option value="SCOOTER">Scooter</option>
                <option value="COMMUTER">Commuter</option>
                <option value="SPORTS_BIKE">Sports Bike</option>
                <option value="CRUISER">Cruiser</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Fuel Type
              </label>
              <select
                value={newVehicle.fuelType}
                onChange={(e) => setNewVehicle({ ...newVehicle, fuelType: e.target.value as any })}
                className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="PETROL">Petrol</option>
                <option value="ELECTRIC">Electric</option>
                <option value="HYBRID">Hybrid</option>
                <option value="DIESEL">Diesel</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Transmission
              </label>
              <select
                value={newVehicle.transmission}
                onChange={(e) => setNewVehicle({ ...newVehicle, transmission: e.target.value as any })}
                className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="AUTOMATIC">Automatic</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60 space-y-2">
            <div className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Tiered Pricing ($)
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Daily Rate</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newVehicle.pricing.dailyRate}
                  onChange={(e) =>
                    setNewVehicle({
                      ...newVehicle,
                      pricing: { ...newVehicle.pricing, dailyRate: Number(e.target.value) },
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 p-1.5 text-xs dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Weekly Rate</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newVehicle.pricing.weeklyRate}
                  onChange={(e) =>
                    setNewVehicle({
                      ...newVehicle,
                      pricing: { ...newVehicle.pricing, weeklyRate: Number(e.target.value) },
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 p-1.5 text-xs dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Monthly Rate</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newVehicle.pricing.monthlyRate}
                  onChange={(e) =>
                    setNewVehicle({
                      ...newVehicle,
                      pricing: { ...newVehicle.pricing, monthlyRate: Number(e.target.value) },
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 p-1.5 text-xs dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Deposit</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newVehicle.pricing.securityDeposit}
                  onChange={(e) =>
                    setNewVehicle({
                      ...newVehicle,
                      pricing: { ...newVehicle.pricing, securityDeposit: Number(e.target.value) },
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 p-1.5 text-xs dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Image URL
            </label>
            <input
              type="url"
              required
              value={newVehicle.imageUrl}
              onChange={(e) => setNewVehicle({ ...newVehicle, imageUrl: e.target.value })}
              className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Vehicle Description
            </label>
            <textarea
              rows={2}
              required
              placeholder="Highlight condition, comfort, handling, and key features..."
              value={newVehicle.description}
              onChange={(e) => setNewVehicle({ ...newVehicle, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddVehicleOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmittingVehicle}
              className="flex-1 font-bold bg-emerald-600 hover:bg-emerald-700"
            >
              Add to Fleet
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Reject Request Dialog */}
      <Dialog
        isOpen={!!rejectBookingId}
        onClose={() => setRejectBookingId(null)}
        title="Decline Booking Request"
        description="Provide a reason for the customer regarding why the request cannot be accommodated."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Decline Reason
            </label>
            <input
              type="text"
              placeholder="e.g. Scheduled workshop inspection, unreturned from prior booking..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setRejectBookingId(null)} className="flex-1">
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleUpdateBookingStatus(rejectBookingId!, "REJECTED", rejectReason)}
              className="flex-1 font-bold"
            >
              Confirm Decline
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Schedule Maintenance Dialog */}
      <Dialog
        isOpen={!!maintVehicleId}
        onClose={() => setMaintVehicleId(null)}
        title="Schedule Maintenance Downtime"
        description="Block future dates for service or repairs to automatically prevent customer reservations."
      >
        <form onSubmit={handleScheduleMaintenance} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={maintStart}
                onChange={(e) => setMaintStart(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={maintEnd}
                onChange={(e) => setMaintEnd(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Service Reason / Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 15,000 miles service, tire replacement, brake pads"
              value={maintReason}
              onChange={(e) => setMaintReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMaintVehicleId(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 font-bold bg-amber-600 hover:bg-amber-700">
              Lock Dates
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
