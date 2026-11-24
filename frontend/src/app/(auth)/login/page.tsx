"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../store/authStore";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import {
  Car,
  Lock,
  Mail,
  User,
  Building2,
  Shield,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { UserRole } from "../../../types";

export default function LoginPage() {
  const router = useRouter();
  const { login, quickDemoLogin, isLoading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.firstName}!`);

      if (user.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (user.role === "AGENCY_OWNER") {
        router.push("/dashboard/agency");
      } else {
        router.push("/vehicles");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    }
  };

  const handleDemoSignIn = async (role: UserRole) => {
    setError(null);
    try {
      const user = await quickDemoLogin(role);
      toast.success(`Signed in as ${user.firstName} (${role})`);

      if (role === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (role === "AGENCY_OWNER") {
        router.push("/dashboard/agency");
      } else {
        router.push("/vehicles");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in with demo account");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Car className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-gray-950 dark:text-white">
            Sign In to RentiGo
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Access your rentals, manage fleet operations, or view analytics
          </p>
        </div>

        {/* 1-Click Demo Accounts Pill Box */}
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/30">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300 mb-2.5">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span>1-Click Test Drive (Pre-configured demo users)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoSignIn("CUSTOMER")}
              disabled={isLoading}
              className="flex flex-col items-center justify-center rounded-xl bg-white p-2.5 text-center shadow-sm hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20 transition-all dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            >
              <User className="h-4 w-4 text-blue-600 mb-1" />
              <span className="text-[11px] font-bold text-gray-800 dark:text-white">
                Customer
              </span>
              <span className="text-[9px] text-gray-400">Alex Rider</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSignIn("AGENCY_OWNER")}
              disabled={isLoading}
              className="flex flex-col items-center justify-center rounded-xl bg-white p-2.5 text-center shadow-sm hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/20 transition-all dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            >
              <Building2 className="h-4 w-4 text-emerald-600 mb-1" />
              <span className="text-[11px] font-bold text-gray-800 dark:text-white">
                Agency
              </span>
              <span className="text-[9px] text-gray-400">Apex Rentals</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSignIn("ADMIN")}
              disabled={isLoading}
              className="flex flex-col items-center justify-center rounded-xl bg-white p-2.5 text-center shadow-sm hover:border-purple-500 hover:ring-2 hover:ring-purple-500/20 transition-all dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            >
              <Shield className="h-4 w-4 text-purple-600 mb-1" />
              <span className="text-[11px] font-bold text-gray-800 dark:text-white">
                Admin
              </span>
              <span className="text-[9px] text-gray-400">Sarah J.</span>
            </button>
          </div>
        </div>

        {/* Main Login Card */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              size="lg"
              className="w-full font-bold shadow-md shadow-blue-500/25 mt-2"
            >
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-4 text-center text-xs text-gray-500 dark:border-gray-800">
            Don't have an account yet?{" "}
            <Link
              href="/register"
              className="font-bold text-blue-600 hover:underline dark:text-blue-400"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
