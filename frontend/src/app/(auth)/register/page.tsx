"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../store/authStore";
import { Button } from "../../../components/ui/Button";
import {
  Car,
  Lock,
  Mail,
  User,
  Building2,
  Phone,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { UserRole } from "../../../types";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();

  const [role, setRole] = useState<UserRole>("CUSTOMER");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Agency fields
  const [agencyName, setAgencyName] = useState("");
  const [agencyAddress, setAgencyAddress] = useState("");
  const [agencyCity, setAgencyCity] = useState("San Francisco");
  const [agencyState, setAgencyState] = useState("CA");
  const [agencyPhone, setAgencyPhone] = useState("");

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: any = {
      role,
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      password,
    };

    if (role === "AGENCY_OWNER") {
      if (!agencyName || !agencyAddress || !agencyCity || !agencyState) {
        setError("Please fill in all agency details");
        return;
      }
      payload.agency = {
        name: agencyName,
        address: agencyAddress,
        city: agencyCity,
        state: agencyState,
        contactPhone: agencyPhone || phone,
        contactEmail: email,
      };
    }

    try {
      const user = await register(payload);
      toast.success(`Account registered! Welcome to RentiGo, ${user.firstName}.`);

      if (user.role === "AGENCY_OWNER") {
        router.push("/dashboard/agency");
      } else {
        router.push("/vehicles");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Car className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-gray-950 dark:text-white">
            Create Your RentiGo Account
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Join thousands of drivers and fleet operators
          </p>
        </div>

        {/* Account Role Selector Segment */}
        <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => setRole("CUSTOMER")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              role === "CUSTOMER"
                ? "bg-white text-blue-600 shadow-sm dark:bg-gray-900 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <User className="h-4 w-4" />
            <span>I want to Rent (Customer)</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("AGENCY_OWNER")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              role === "AGENCY_OWNER"
                ? "bg-white text-emerald-600 shadow-sm dark:bg-gray-900 dark:text-emerald-400"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Rental Agency Owner</span>
          </button>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Alex"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rider"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="alex.rider@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1-555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* Extra Fields if Rental Agency Owner */}
            {role === "AGENCY_OWNER" && (
              <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800 animate-in fade-in">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Agency Business Profile
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Agency Company Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Luxury Fleet Rentals"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    HQ Street Address
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="742 Evergreen Blvd"
                    value={agencyAddress}
                    onChange={(e) => setAgencyAddress(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="San Francisco"
                      value={agencyCity}
                      onChange={(e) => setAgencyCity(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="CA"
                      value={agencyState}
                      onChange={(e) => setAgencyState(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              isLoading={isLoading}
              size="lg"
              className={`w-full font-bold shadow-md mt-4 ${
                role === "AGENCY_OWNER"
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25"
                  : "shadow-blue-500/25"
              }`}
            >
              <span>Complete Registration</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-4 text-center text-xs text-gray-500 dark:border-gray-800">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-blue-600 hover:underline dark:text-blue-400"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
