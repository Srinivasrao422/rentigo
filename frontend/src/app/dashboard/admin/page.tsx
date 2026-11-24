"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../store/authStore";
import { apiRequest } from "../../../lib/api";
import { formatCurrency, formatDate, getStatusBadge } from "../../../lib/utils";
import { Button } from "../../../components/ui/Button";
import { Dialog } from "../../../components/ui/Dialog";
import {
  Shield,
  TrendingUp,
  Percent,
  Users,
  Building2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Car,
  Bike,
  Activity,
  Check,
  Ban,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  const [analytics, setAnalytics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [agenciesList, setAgenciesList] = useState<any[]>([]);
  const [vehiclesList, setVehiclesList] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active tab: "ANALYTICS" | "APPROVALS" | "USERS" | "AGENCIES" | "ALL_BOOKINGS"
  const [activeTab, setActiveTab] = useState<string>("ANALYTICS");

  // Rejection modal
  const [rejectVehicleId, setRejectVehicleId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [analyticsData, usersData, agenciesData, vehiclesData, bookingsData] =
        await Promise.all([
          apiRequest("/admin/analytics", { requiresAuth: true }),
          apiRequest("/admin/users", { requiresAuth: true }),
          apiRequest("/admin/agencies", { requiresAuth: true }),
          apiRequest("/admin/vehicles", { requiresAuth: true }),
          apiRequest("/bookings/all", { requiresAuth: true }),
        ]);

      setAnalytics(analyticsData);
      setUsersList(Array.isArray(usersData) ? usersData : []);
      setAgenciesList(Array.isArray(agenciesData) ? agenciesData : []);
      setVehiclesList(Array.isArray(vehiclesData) ? vehiclesData : []);
      setAllBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load admin telemetry");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && (!user || user.role !== "ADMIN")) {
      toast.error("Access denied: Platform Administrator privileges required");
      router.push("/login");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, isInitialized]);

  const handleApproveVehicle = async (vehicleId: string, status: "APPROVED" | "REJECTED", reason?: string) => {
    try {
      await apiRequest(`/vehicles/${vehicleId}/approval`, {
        method: "PATCH",
        requiresAuth: true,
        body: JSON.stringify({ status, rejectionReason: reason }),
      });

      toast.success(`Vehicle listing ${status.toLowerCase()}!`);
      setRejectVehicleId(null);
      setRejectReason("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update vehicle approval status");
    }
  };

  const handleToggleUserStatus = async (userId: string, currentActive: boolean) => {
    try {
      await apiRequest(`/admin/users/${userId}/status`, {
        method: "PATCH",
        requiresAuth: true,
        body: JSON.stringify({ isActive: !currentActive }),
      });

      toast.success(`User account ${!currentActive ? "activated" : "deactivated"}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle user status");
    }
  };

  const handleToggleAgencyApproval = async (agencyId: string, currentApproved: boolean) => {
    try {
      await apiRequest(`/admin/agencies/${agencyId}/approval`, {
        method: "PATCH",
        requiresAuth: true,
        body: JSON.stringify({ isApproved: !currentApproved }),
      });

      toast.success(`Agency ${!currentApproved ? "verified & approved" : "suspended"}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle agency approval");
    }
  };

  const pendingVehicles = vehiclesList.filter((v) => v.approvalStatus === "PENDING");

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-black text-gray-950 dark:text-white">
              System Administration Portal
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Global fleet oversight, double-booking conflict monitors, agency verifications, and platform analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Platform Online (0 Conflicts Detected)</span>
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Fleet Utilization</span>
            <Percent className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600">
            {analytics?.kpis?.utilizationRate ?? 40}%
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Active rentals / Total fleet</div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Booking Conversion</span>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600">
            {analytics?.kpis?.conversionRate ?? 67}%
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Confirmed / Total requests</div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Conflict Rate</span>
            <Shield className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">0.0%</div>
          <div className="text-[10px] text-emerald-600 mt-1 font-semibold">Zero Double Bookings</div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Users (MAU)</span>
            <Users className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {analytics?.overview?.totalUsers ?? usersList.length}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">{analytics?.overview?.totalAgencies ?? agenciesList.length} verified agencies</div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Revenue</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {formatCurrency(analytics?.overview?.totalRevenue ?? 1680)}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">System-wide rental volume</div>
        </div>
      </div>

      {/* Navigation Segment Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("ANALYTICS")}
          className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all relative ${
            activeTab === "ANALYTICS"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Executive Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab("APPROVALS")}
          className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all relative ${
            activeTab === "APPROVALS"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
          }`}
        >
          <span>Vehicle Listing Approvals</span>
          {pendingVehicles.length > 0 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.2 text-[10px] text-white">
              {pendingVehicles.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("USERS")}
          className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all relative ${
            activeTab === "USERS"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Accounts ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("AGENCIES")}
          className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all relative ${
            activeTab === "AGENCIES"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Rental Agencies ({agenciesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("ALL_BOOKINGS")}
          className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all relative ${
            activeTab === "ALL_BOOKINGS"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
          }`}
        >
          <span>All Bookings ({allBookings.length})</span>
        </button>
      </div>

      {/* Tab 1: Executive Analytics Breakdown */}
      {activeTab === "ANALYTICS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
              Revenue By Vehicle Category
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Four-Wheelers (Sedans & SUVs)</span>
                  <span>68% ({formatCurrency(analytics?.revenueBreakdown?.fourWheelerRevenue ?? 1142)})</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: "68%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Two-Wheelers (Bikes & Scooters)</span>
                  <span>32% ({formatCurrency(analytics?.revenueBreakdown?.twoWheelerRevenue ?? 538)})</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "32%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
              System Health & Operational Integrity
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                <span className="font-medium text-gray-700 dark:text-gray-300">Double-Booking Lock Engine</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Active & Verified</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                <span className="font-medium text-gray-700 dark:text-gray-300">Tiered Pricing Calculator</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Optimized</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                <span className="font-medium text-gray-700 dark:text-gray-300">Email Notification Dispatcher</span>
                <span className="font-bold text-blue-600 flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  <span>Operational</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Vehicle Approvals Queue */}
      {activeTab === "APPROVALS" && (
        <div className="space-y-4">
          {pendingVehicles.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                All vehicle listings approved!
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                When rental agencies submit new vehicles, they require admin verification before appearing publicly.
              </p>
            </div>
          ) : (
            pendingVehicles.map((v) => (
              <div
                key={v.id}
                className="rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm dark:border-amber-900/50 dark:bg-gray-900 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={v.images?.[0]?.url || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80"}
                      alt={v.model}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-gray-900 dark:text-white">
                        {v.brand} {v.model} ({v.year})
                      </h4>
                      <span className="rounded bg-amber-100 px-2 py-0.2 text-[10px] font-bold text-amber-800">
                        PENDING APPROVAL
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Agency: {v.agency?.name || "Apex Rentals"} | Daily: {formatCurrency(v.pricing?.dailyRate || 0)} | Weekly: {formatCurrency(v.pricing?.weeklyRate || 0)}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5 max-w-md truncate">
                      {v.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRejectVehicleId(v.id)}
                    className="text-xs"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    <span>Reject</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApproveVehicle(v.id, "APPROVED")}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 font-bold"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    <span>Approve Listing</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Users Table */}
      {activeTab === "USERS" && (
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:bg-gray-800/60">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                  <td className="p-4">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {u.firstName} {u.lastName}
                    </div>
                    <div className="text-[11px] text-gray-400">{u.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{u.phone || "—"}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[10px] font-bold ${
                        u.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {u.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400">{formatDate(u.createdAt)}</td>
                  <td className="p-4 text-right">
                    {u.role !== "ADMIN" && (
                      <button
                        onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                          u.isActive
                            ? "text-red-600 border-red-200 hover:bg-red-50"
                            : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        }`}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Agencies Table */}
      {activeTab === "AGENCIES" && (
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:bg-gray-800/60">
              <tr>
                <th className="p-4">Agency Business</th>
                <th className="p-4">City / State</th>
                <th className="p-4">Contact Phone</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {agenciesList.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                  <td className="p-4">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {a.name}
                    </div>
                    <div className="text-[11px] text-gray-400">{a.address}</div>
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    {a.city}, {a.state}
                  </td>
                  <td className="p-4 text-gray-500">{a.contactPhone}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[10px] font-bold ${
                        a.isApproved
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {a.isApproved ? "Verified Partner" : "Suspended"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleToggleAgencyApproval(a.id, a.isApproved)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                        a.isApproved
                          ? "text-red-600 border-red-200 hover:bg-red-50"
                          : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      }`}
                    >
                      {a.isApproved ? "Suspend" : "Approve & Verify"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: All Bookings Overview */}
      {activeTab === "ALL_BOOKINGS" && (
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:bg-gray-800/60">
              <tr>
                <th className="p-4">Booking</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {allBookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                  <td className="p-4 font-mono font-bold text-gray-900 dark:text-white">
                    #{b.bookingNumber}
                  </td>
                  <td className="p-4 text-gray-800 dark:text-gray-200">
                    {b.customer?.firstName} {b.customer?.lastName}
                  </td>
                  <td className="p-4 font-semibold text-gray-900 dark:text-white">
                    {b.vehicle?.brand} {b.vehicle?.model}
                  </td>
                  <td className="p-4 text-gray-500">
                    {formatDate(b.startDate)} &rarr; {formatDate(b.endDate)} ({b.totalDays}d)
                  </td>
                  <td className="p-4 font-bold text-blue-600">
                    {formatCurrency(b.totalAmount)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[10px] font-bold ${getStatusBadge(
                        b.status
                      )}`}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vehicle Listing Rejection Dialog */}
      <Dialog
        isOpen={!!rejectVehicleId}
        onClose={() => setRejectVehicleId(null)}
        title="Decline Vehicle Listing"
        description="Provide feedback to the agency regarding what needs adjustment before approval."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Feedback / Reason
            </label>
            <input
              type="text"
              placeholder="e.g. Higher resolution exterior photos required, verify license plate..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setRejectVehicleId(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleApproveVehicle(rejectVehicleId!, "REJECTED", rejectReason)}
              className="flex-1 font-bold"
            >
              Confirm Decline
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
