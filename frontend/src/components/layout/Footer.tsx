import React from "react";
import Link from "next/link";
import { Car, Bike, ShieldCheck, HeartHandshake, PhoneCall } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/60 mt-auto">
      <div className="container mx-auto px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Car className="h-5 w-5" />
              </div>
              <span className="text-xl font-black text-gray-950 dark:text-white">
                Renti<span className="text-blue-600">Go</span>
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The modern vehicle rental management ecosystem. Seamless booking, guaranteed real-time availability, and tiered long-term rates.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Fleet Selection
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/vehicles?type=FOUR_WHEELER" className="hover:text-blue-600">
                  Electric Sedans & Luxury
                </Link>
              </li>
              <li>
                <Link href="/vehicles?category=SUV" className="hover:text-blue-600">
                  SUVs & Family Crossovers
                </Link>
              </li>
              <li>
                <Link href="/vehicles?type=TWO_WHEELER" className="hover:text-blue-600">
                  Urban Scooters & Vespas
                </Link>
              </li>
              <li>
                <Link href="/vehicles?category=SPORTS_BIKE" className="hover:text-blue-600">
                  Cruisers & Sports Bikes
                </Link>
              </li>
            </ul>
          </div>

          {/* Value Props */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Trust & Guarantees
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Zero Double Booking Guarantee</span>
              </li>
              <li className="flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-blue-500" />
                <span>Verified Rental Agencies</span>
              </li>
              <li className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-purple-500" />
                <span>24/7 Roadside Assistance</span>
              </li>
            </ul>
          </div>

          {/* For Agencies */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Agency Partners
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Are you a rental agency owner? List your fleet and unlock automated bookings and scheduling tools.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
            >
              Register your Agency Fleet &rarr;
            </Link>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-6 text-center text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
          <p>© {new Date().getFullYear()} RentiGo Technologies Inc. All rights reserved. Built for production-grade vehicle fleet operations.</p>
        </div>
      </div>
    </footer>
  );
}
