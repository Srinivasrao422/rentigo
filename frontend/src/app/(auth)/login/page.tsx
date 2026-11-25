"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../store/authStore";
import { apiRequest } from "../../../lib/api";
import { Button } from "../../../components/ui/Button";
import { Dialog } from "../../../components/ui/Dialog";
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

function getBookingReturn() {
  const returnTo = new URLSearchParams(window.location.search).get("returnTo");
  return returnTo && /^\/vehicles\/[A-Za-z0-9_-]+\?[^#]*#booking$/.test(returnTo)
    ? returnTo
    : null;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, quickDemoLogin, isLoading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [bookingReturn, setBookingReturn] = useState<string | null>(null);

  // Forgot Password modal state
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetStep, setResetStep] = useState<"REQUEST" | "CONFIRM">("REQUEST");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    setBookingReturn(getBookingReturn());
  }, []);

  const finishSignIn = (role: UserRole) => {
    if (role === "ADMIN") return router.push("/dashboard/admin");
    if (role === "AGENCY_OWNER") return router.push("/dashboard/agency");

    const returnTo = getBookingReturn();
    if (returnTo) return router.replace(returnTo);
    router.push("/vehicles");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.firstName}!`);

      finishSignIn(user.role);
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    }
  };

  const handleDemoSignIn = async (role: UserRole) => {
    setError(null);
    try {
      const user = await quickDemoLogin(role);
      toast.success(`Signed in as ${user.firstName} (${role})`);

      finishSignIn(user.role);
    } catch (err: any) {
      setError(err.message || "Failed to sign in with demo account");
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    try {
      await apiRequest("/auth/forgot-password", {
        method: "POST",
        requiresAuth: false,
        body: JSON.stringify({ email: resetEmail }),
      });
      toast.success("If an account exists for that email, a password reset token has been issued.");
      setResetStep("CONFIRM");
    } catch (err: any) {
      toast.error(err.message || "Failed to request password reset");
    } finally {
      setIsResetting(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        requiresAuth: false,
        body: JSON.stringify({ token: resetToken, newPassword: resetNewPassword }),
      });
      toast.success("Password updated! Please sign in with your new password.");
      setIsResetOpen(false);
      setResetStep("REQUEST");
      setResetToken("");
      setResetNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setIsResetting(false);
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
            {bookingReturn ? "Sign in to continue booking" : "Sign in to RentiGo"}
          </h2>
          {bookingReturn && (
            <>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Sign in with a renter account to return to your vehicle. We will check availability and price again for your selected dates.
              </p>
              <Link href={bookingReturn} className="mt-3 inline-block rounded-sm text-sm font-semibold text-blue-700 underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-blue-300">
                Back to your quote
              </Link>
            </>
          )}
        </div>

        {/* 1-Click Demo Accounts Pill Box (Development & Staging only) */}
        {process.env.NODE_ENV !== "production" && (
          <div className="rounded-2xl border border-blue-200/80 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/30">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300 mb-2.5">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>1-Click Test Drive (Pre-configured demo users - Dev Only)</span>
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
        )}

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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setIsResetOpen(true);
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Forgot password?
                </button>
              </div>
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

      {/* Password Reset Dialog */}
      <Dialog
        isOpen={isResetOpen}
        onClose={() => {
          setIsResetOpen(false);
          setResetStep("REQUEST");
        }}
        title="Reset Your Password"
        description={
          resetStep === "REQUEST"
            ? "Enter your account email address to request a password reset token."
            : "Enter the reset token and choose a new password (minimum 8 characters)."
        }
      >
        {resetStep === "REQUEST" ? (
          <form onSubmit={handleRequestReset} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Account Email
              </label>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsResetOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" isLoading={isResetting} className="flex-1 font-bold">
                Send Reset Token
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleConfirmReset} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Reset Token
              </label>
              <input
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste reset token"
                className="w-full rounded-lg border border-gray-300 p-2.5 font-mono dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setResetStep("REQUEST")} className="flex-1">
                Back
              </Button>
              <Button type="submit" isLoading={isResetting} className="flex-1 font-bold">
                Reset Password
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
