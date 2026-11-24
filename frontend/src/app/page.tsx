"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Vehicle } from "../types";
import { apiRequest } from "../lib/api";
import VehicleCard from "../components/vehicles/VehicleCard";
import { Button } from "../components/ui/Button";
import {
  Car,
  Bike,
  ShieldCheck,
  CalendarCheck,
  Coins,
  ChevronRight,
  Search,
  Sparkles,
  ArrowRight,
  Building2,
  Clock,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hero Quick Search
  const [type, setType] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    apiRequest<Vehicle[]>("/vehicles?limit=6", { requiresAuth: false })
      .then((data) => {
        setVehicles(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (city) params.set("city", city);
    if (search) params.set("search", search);
    router.push(`/vehicles?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-slate-900 to-gray-950 text-white py-20 lg:py-28">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="container relative mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300 backdrop-blur-md mb-6 animate-in fade-in slide-in-from-bottom-2">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Next-Generation Fleet Rental Platform</span>
          </div>

          <h1 className="max-w-4xl mx-auto text-4xl sm:text-6xl font-black tracking-tight leading-tight sm:leading-tight">
            Rent Two-Wheelers & Four-Wheelers.{" "}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              Daily, Weekly, or Monthly.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto mt-6 text-base sm:text-lg text-slate-300">
            Say goodbye to spreadsheets and double bookings. Discover verified cars, electric vehicles, sport bikes, and city scooters with automated availability conflict prevention.
          </p>

          {/* Hero Interactive Search Bar */}
          <div className="max-w-3xl mx-auto mt-10 rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-xl shadow-2xl">
            <form onSubmit={handleHeroSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-left">
                <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Make or Model..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-left">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-transparent text-xs text-white focus:outline-none [&>option]:bg-gray-900 [&>option]:text-white"
                >
                  <option value="">All Vehicle Types</option>
                  <option value="FOUR_WHEELER">Four-Wheelers (Cars/SUVs)</option>
                  <option value="TWO_WHEELER">Two-Wheelers (Bikes/Scooters)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-left">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-transparent text-xs text-white focus:outline-none [&>option]:bg-gray-900 [&>option]:text-white"
                >
                  <option value="">All Locations</option>
                  <option value="San Francisco">San Francisco, CA</option>
                  <option value="Austin">Austin, TX</option>
                </select>
              </div>

              <Button type="submit" size="lg" className="w-full font-bold shadow-md shadow-blue-500/30">
                Explore Fleet
              </Button>
            </form>
          </div>

          {/* Fast Quick Links */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span>Popular picks:</span>
            <Link
              href="/vehicles?type=FOUR_WHEELER&category=SEDAN"
              className="rounded-full bg-white/5 border border-white/10 px-3 py-1 hover:bg-white/10 text-white transition-colors flex items-center gap-1.5"
            >
              <Car className="h-3 w-3 text-blue-400" />
              <span>Tesla Model 3</span>
            </Link>
            <Link
              href="/vehicles?type=FOUR_WHEELER&category=SUV"
              className="rounded-full bg-white/5 border border-white/10 px-3 py-1 hover:bg-white/10 text-white transition-colors flex items-center gap-1.5"
            >
              <Car className="h-3 w-3 text-blue-400" />
              <span>BMW X5 Luxury</span>
            </Link>
            <Link
              href="/vehicles?type=TWO_WHEELER&category=SPORTS_BIKE"
              className="rounded-full bg-white/5 border border-white/10 px-3 py-1 hover:bg-white/10 text-white transition-colors flex items-center gap-1.5"
            >
              <Bike className="h-3 w-3 text-emerald-400" />
              <span>Ducati Monster</span>
            </Link>
            <Link
              href="/vehicles?type=TWO_WHEELER&category=SCOOTER"
              className="rounded-full bg-white/5 border border-white/10 px-3 py-1 hover:bg-white/10 text-white transition-colors flex items-center gap-1.5"
            >
              <Bike className="h-3 w-3 text-emerald-400" />
              <span>Vespa GTS 300</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Featured Fleet Grid */}
      <section className="py-16 container mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Verified Fleet
            </div>
            <h2 className="text-3xl font-extrabold text-gray-950 dark:text-white mt-1">
              Top Rated Vehicles Ready for You
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Book by the day, week, or month with guaranteed real-time availability.
            </p>
          </div>

          <Link href="/vehicles">
            <Button variant="outline" className="flex items-center gap-1 text-xs">
              <span>View All Fleet</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-gray-200 animate-pulse dark:bg-gray-800"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </section>

      {/* 3. Problem & Solution Value Pillars */}
      <section className="bg-gray-100/60 dark:bg-gray-900/40 py-20 border-y border-gray-200/80 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Modern Architecture
            </div>
            <h2 className="text-3xl font-extrabold text-gray-950 dark:text-white mt-1">
              Why Traditional Vehicle Rentals Fail
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Relying on phone calls and WhatsApp spreadsheets leads to double-bookings and lost revenue. RentiGo solves this permanently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-gray-200/80 bg-white p-7 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-5">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                ACID Conflict Prevention
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automated date range overlap checks inside PostgreSQL transactions ensure two customers never reserve the same car or bike simultaneously.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-white p-7 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-5">
                <Coins className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Automated Tiered Savings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Our smart price engine analyzes booking duration and applies weekly and monthly bundle packages when beneficial, saving customers up to 40%.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-white p-7 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-5">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Maintenance Schedule Locks
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Rental agencies can block maintenance downtime, oil changes, or repairs without accidental overlap with active bookings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works */}
      <section className="py-20 container mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-14">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Simple 3-Step Flow
          </div>
          <h2 className="text-3xl font-extrabold text-gray-950 dark:text-white mt-1">
            How RentiGo Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
              1
            </div>
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              Select Vehicle & Dates
            </h4>
            <p className="text-xs text-gray-500 max-w-xs">
              Pick your two-wheeler or four-wheeler and choose your pickup and drop-off dates. Real-time availability checks instant.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
              2
            </div>
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              Agency Fast Approval
            </h4>
            <p className="text-xs text-gray-500 max-w-xs">
              The rental agency gets notified immediately, reviews your rental details, and approves your booking request.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
              3
            </div>
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              Pickup & Hit the Road
            </h4>
            <p className="text-xs text-gray-500 max-w-xs">
              Pickup from the agency headquarters or airport drop point. Drive with 24/7 support and return when done.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Agency Partner Banner */}
      <section className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-300 mb-2">
              <Building2 className="h-4 w-4" />
              <span>For Fleet & Agency Owners</span>
            </div>
            <h2 className="text-3xl font-extrabold">
              Digitize Your Entire Vehicle Fleet Today
            </h2>
            <p className="text-sm text-slate-300 mt-2 max-w-xl">
              Gain access to automated booking approvals, calendar scheduling, tiered pricing tools, and real-time revenue analytics.
            </p>
          </div>
          <Link href="/register">
            <Button size="lg" className="bg-white text-gray-950 hover:bg-slate-100 font-bold whitespace-nowrap">
              Register as Agency Owner
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
