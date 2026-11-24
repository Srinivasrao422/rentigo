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
  ArrowRight,
  Building2,
  Clock,
} from "lucide-react";

import { rentalDate, rentalRange } from "../lib/rentalDates";

const searchControl = "min-h-11 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-gray-600 dark:bg-slate-900 dark:text-white";

export default function HomePage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hero Quick Search
  const [type, setType] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCity(params.get("city") || "");
    setType(params.get("type") || "");
    setSearch(params.get("search") || "");
    const range = rentalRange(params.get("startDate") || "", params.get("endDate") || "");
    if (range) {
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
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
    const params = new URLSearchParams(window.location.search);
    for (const key of ["startDate", "endDate", "city", "type", "search"]) params.delete(key);
    const range = rentalRange(startDate, endDate);
    if ((startDate || endDate) && (!range || startDate < rentalDate())) {
      setDateError("Choose a pickup date and a later return date.");
      return;
    }
    if (range) {
      params.set("startDate", range.startDate);
      params.set("endDate", range.endDate);
    }
    if (type) params.set("type", type);
    if (city) params.set("city", city);
    if (search) params.set("search", search);
    router.push(`/vehicles?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-slate-950 py-12 text-white lg:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <h1 className="max-w-xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Find a rental for your dates
              </h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
                Browse cars, bikes, and scooters by pickup city. Check availability and see your total for a day, a week, or longer.
              </p>
            </div>
            {vehicles.some((vehicle) => vehicle.images?.length) && (
              <div className="hidden gap-3 lg:grid lg:grid-cols-2">
                {vehicles.filter((vehicle) => vehicle.images?.length).slice(0, 2).map((vehicle) => (
                  <img
                    key={vehicle.id}
                    src={(vehicle.images.find((image) => image.isPrimary) || vehicle.images[0]).url}
                    alt={`${vehicle.brand} ${vehicle.model} from the rental fleet`}
                    className="aspect-[4/3] w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleHeroSearch} className="mt-8 rounded-xl bg-white p-4 text-gray-950 dark:bg-slate-800 dark:text-white sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
              <label className="grid min-w-0 gap-1.5 text-sm font-semibold" htmlFor="hero-city">
                Pickup city
                <select id="hero-city" className={searchControl} value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="">All cities</option>
                  <option value="Bengaluru">Bengaluru, KA</option>
                  <option value="Mumbai">Mumbai, MH</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Goa">Goa</option>
                  <option value="Hyderabad">Hyderabad, TS</option>
                  <option value="Pune">Pune, MH</option>
                  <option value="Jaipur">Jaipur, RJ</option>
                </select>
              </label>
              <label className="grid min-w-0 gap-1.5 text-sm font-semibold" htmlFor="hero-start">
                Pickup date
                <input id="hero-start" type="date" className={searchControl} value={startDate} min={rentalDate()} aria-describedby={dateError ? "hero-date-error" : undefined} onChange={(e) => { setStartDate(e.target.value); setDateError(""); }} />
              </label>
              <label className="grid min-w-0 gap-1.5 text-sm font-semibold" htmlFor="hero-end">
                Return date
                <input id="hero-end" type="date" className={searchControl} value={endDate} min={startDate || rentalDate(1)} aria-describedby={dateError ? "hero-date-error" : undefined} onChange={(e) => { setEndDate(e.target.value); setDateError(""); }} />
              </label>
              <Button type="submit" size="lg" className="min-h-11 w-full">Find vehicles</Button>
            </div>
            {dateError && <p id="hero-date-error" role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{dateError}</p>}
            <details className="mt-4 border-t border-gray-200 pt-3 text-sm dark:border-slate-600">
              <summary className="w-fit cursor-pointer rounded-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">Search by make or vehicle type</summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 font-semibold" htmlFor="hero-search">
                  Make or model
                  <input id="hero-search" type="search" className={searchControl} value={search} onChange={(e) => setSearch(e.target.value)} />
                </label>
                <label className="grid gap-1.5 font-semibold" htmlFor="hero-type">
                  Vehicle type
                  <select id="hero-type" className={searchControl} value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="">All vehicle types</option>
                    <option value="FOUR_WHEELER">Cars and SUVs</option>
                    <option value="TWO_WHEELER">Bikes and scooters</option>
                  </select>
                </label>
              </div>
            </details>
          </form>

          {/* Fast Quick Links */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span>Popular Indian picks:</span>
            <Link
              href="/vehicles?search=Thar"
              className="rounded-full bg-white/5 border border-white/10 px-3 py-1 hover:bg-white/10 text-white transition-colors flex items-center gap-1.5"
            >
              <Car className="h-3 w-3 text-blue-400" />
              <span>Mahindra Thar 4x4</span>
            </Link>
            <Link
              href="/vehicles?search=Nexon"
              className="rounded-full bg-white/5 border border-white/10 px-3 py-1 hover:bg-white/10 text-white transition-colors flex items-center gap-1.5"
            >
              <Car className="h-3 w-3 text-blue-400" />
              <span>Tata Nexon EV</span>
            </Link>
            <Link
              href="/vehicles?search=Classic"
              className="rounded-full bg-white/5 border border-white/10 px-3 py-1 hover:bg-white/10 text-white transition-colors flex items-center gap-1.5"
            >
              <Bike className="h-3 w-3 text-emerald-400" />
              <span>Royal Enfield Classic 350</span>
            </Link>
            <Link
              href="/vehicles?search=Activa"
              className="rounded-full bg-white/5 border border-white/10 px-3 py-1 hover:bg-white/10 text-white transition-colors flex items-center gap-1.5"
            >
              <Bike className="h-3 w-3 text-emerald-400" />
              <span>Honda Activa 6G</span>
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
              Manage reservations and maintenance in one place, without juggling spreadsheets or double bookings.
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
