"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../ui/Button";
import {
  Car,
  Bike,
  Shield,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";
import { UserRole } from "../../types";

export default function Navbar() {
  const router = useRouter();
  const { user, logout, quickDemoLogin, isLoading } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    toast.success("Logged out successfully");
    router.push("/");
  };

  const handleDemoLogin = async (role: UserRole) => {
    try {
      await quickDemoLogin(role);
      setDemoMenuOpen(false);
      setMobileMenuOpen(false);
      const roleLabel =
        role === "ADMIN"
          ? "Admin"
          : role === "AGENCY_OWNER"
          ? "Agency Owner"
          : "Customer";
      toast.success(`Logged in as Demo ${roleLabel}`);

      if (role === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (role === "AGENCY_OWNER") {
        router.push("/dashboard/agency");
      } else {
        router.push("/vehicles");
      }
    } catch {
      toast.error("Failed to switch demo account");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200/80 bg-white/90 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/90">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-gray-950 dark:text-white">
              Renti<span className="text-blue-600">Go</span>
            </span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-gray-500 sm:inline-block ml-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
              Fleet Hub
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
          <Link
            href="/vehicles"
            className="transition-colors hover:text-blue-600 dark:hover:text-white flex items-center gap-1.5"
          >
            <span>All Vehicles</span>
          </Link>
          <Link
            href="/vehicles?type=FOUR_WHEELER"
            className="transition-colors hover:text-blue-600 dark:hover:text-white flex items-center gap-1.5"
          >
            <Car className="h-4 w-4 text-blue-500" />
            <span>Four-Wheelers</span>
          </Link>
          <Link
            href="/vehicles?type=TWO_WHEELER"
            className="transition-colors hover:text-blue-600 dark:hover:text-white flex items-center gap-1.5"
          >
            <Bike className="h-4 w-4 text-emerald-500" />
            <span>Two-Wheelers</span>
          </Link>
          {user && user.role === "CUSTOMER" && (
            <Link
              href="/bookings"
              className="transition-colors hover:text-blue-600 dark:hover:text-white"
            >
              My Bookings
            </Link>
          )}
          {user && user.role === "AGENCY_OWNER" && (
            <Link
              href="/dashboard/agency"
              className="transition-colors text-blue-600 font-semibold flex items-center gap-1"
            >
              <Building2 className="h-4 w-4" />
              <span>Agency Fleet</span>
            </Link>
          )}
          {user && user.role === "ADMIN" && (
            <Link
              href="/dashboard/admin"
              className="transition-colors text-purple-600 font-semibold flex items-center gap-1"
            >
              <Shield className="h-4 w-4" />
              <span>Admin Portal</span>
            </Link>
          )}
        </nav>

        {/* Right CTA / Auth & Demo Switcher */}
        <div className="hidden md:flex items-center gap-3">
          {/* Quick Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setDemoMenuOpen(!demoMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
            >
              <span>Demo Persona</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {demoMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white p-2 shadow-xl border border-gray-100 dark:bg-gray-900 dark:border-gray-800 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Switch Role Instantly
                </div>
                <button
                  onClick={() => handleDemoLogin("CUSTOMER")}
                  disabled={isLoading}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                >
                  <UserIcon className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="font-semibold">Customer (Alex)</div>
                    <div className="text-[10px] text-gray-400">Rent vehicles & book</div>
                  </div>
                </button>
                <button
                  onClick={() => handleDemoLogin("AGENCY_OWNER")}
                  disabled={isLoading}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                >
                  <Building2 className="h-4 w-4 text-emerald-500" />
                  <div>
                    <div className="font-semibold">Agency (Apex Rentals)</div>
                    <div className="text-[10px] text-gray-400">Fleet & booking management</div>
                  </div>
                </button>
                <button
                  onClick={() => handleDemoLogin("ADMIN")}
                  disabled={isLoading}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                >
                  <Shield className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="font-semibold">Platform Admin (Sarah)</div>
                    <div className="text-[10px] text-gray-400">Fleet approvals & analytics</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
                <div className="text-left text-xs">
                  <div className="font-semibold text-gray-900 dark:text-white leading-tight">
                    {user.firstName}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                    {user.role.replace("_", " ")}
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white p-2 shadow-xl border border-gray-100 dark:bg-gray-900 dark:border-gray-800 z-50">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                  </div>

                  {user.role === "CUSTOMER" && (
                    <Link
                      href="/bookings"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>My Bookings</span>
                    </Link>
                  )}

                  {user.role === "AGENCY_OWNER" && (
                    <Link
                      href="/dashboard/agency"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Agency Dashboard</span>
                    </Link>
                  )}

                  {user.role === "ADMIN" && (
                    <Link
                      href="/dashboard/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin Control Center</span>
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-red-50 text-red-600 dark:hover:bg-red-950/40 flex items-center gap-2 mt-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Register</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-950">
          <nav className="flex flex-col gap-3">
            <Link
              href="/vehicles"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Browse All Vehicles
            </Link>
            <Link
              href="/vehicles?type=FOUR_WHEELER"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Four-Wheelers (Cars & SUVs)
            </Link>
            <Link
              href="/vehicles?type=TWO_WHEELER"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Two-Wheelers (Bikes & Scooters)
            </Link>

            {user ? (
              <>
                {user.role === "CUSTOMER" && (
                  <Link
                    href="/bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 text-sm font-medium text-blue-600"
                  >
                    My Bookings
                  </Link>
                )}
                {user.role === "AGENCY_OWNER" && (
                  <Link
                    href="/dashboard/agency"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 text-sm font-medium text-blue-600"
                  >
                    Agency Dashboard
                  </Link>
                )}
                {user.role === "ADMIN" && (
                  <Link
                    href="/dashboard/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 text-sm font-medium text-purple-600"
                  >
                    Admin Portal
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="py-2 text-left text-sm font-medium text-red-600"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1"
                >
                  <Button className="w-full">Register</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
