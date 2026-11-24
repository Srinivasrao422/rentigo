"use client";

import Link from "next/link";
import { rentalDateTime, rentalRange } from "../../lib/rentalDates";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Vehicle } from "../../types";
import { apiRequest } from "../../lib/api";
import VehicleCard from "../../components/vehicles/VehicleCard";
import VehicleFilter from "../../components/vehicles/VehicleFilter";
import { Car, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";

function VehiclesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 9;

  // Filters state initialized from URL search params
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    type: searchParams.get("type") || "",
    category: searchParams.get("category") || "",
    fuelType: searchParams.get("fuelType") || "",
    transmission: searchParams.get("transmission") || "",
    city: searchParams.get("city") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sortBy: searchParams.get("sortBy") || "newest",
  });

  const [requestFailed, setRequestFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const range = rentalRange(startDate, endDate);
  const dateQuery = range ? new URLSearchParams(range).toString() : "";
  const catalogParams = new URLSearchParams(dateQuery);
  for (const [name, value] of Object.entries(filters)) {
    if (value && !(name === "sortBy" && value === "newest")) catalogParams.set(name, value);
  }
  const catalogReturn = catalogParams.toString();

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setRequestFailed(false);
    const query = new URLSearchParams();

    query.set("page", currentPage.toString());
    query.set("limit", pageSize.toString());

    if (filters.search) query.set("search", filters.search);
    if (filters.type) query.set("type", filters.type);
    if (filters.category) query.set("category", filters.category);
    if (filters.fuelType) query.set("fuelType", filters.fuelType);
    if (filters.transmission) query.set("transmission", filters.transmission);
    if (filters.city) query.set("city", filters.city);
    if (filters.minPrice) query.set("minPrice", filters.minPrice);
    if (filters.maxPrice) query.set("maxPrice", filters.maxPrice);

    if (filters.sortBy === "price_low") {
      query.set("sortBy", "dailyRate");
      query.set("sortOrder", "asc");
    } else if (filters.sortBy === "price_high") {
      query.set("sortBy", "dailyRate");
      query.set("sortOrder", "desc");
    } else {
      query.set("sortBy", "createdAt");
      query.set("sortOrder", "desc");
    }

    if (dateQuery) {
      query.set("startDate", rentalDateTime(startDate));
      query.set("endDate", rentalDateTime(endDate));
    }

    apiRequest<any>(`/vehicles?${query.toString()}`, {
      requiresAuth: false,
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted) return;
        if (data && Array.isArray(data.data)) {
          setVehicles(data.data);
          setTotalCount(data.total || data.data.length);
        } else if (Array.isArray(data)) {
          setVehicles(data);
          setTotalCount(data.length);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setRequestFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [filters, dateQuery, startDate, endDate, attempt, currentPage]);

  const handleFilterChange = (updated: Partial<typeof filters>) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setCurrentPage(1);
    setFilters({
      search: "",
      type: "",
      category: "",
      fuelType: "",
      transmission: "",
      city: "",
      minPrice: "",
      maxPrice: "",
      sortBy: "newest",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-950 dark:text-white">
          Explore All Vehicles
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Compare models, view daily/weekly/monthly savings, and check real-time availability.
        </p>
      </div>

      {range && (
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <p>Pickup <time dateTime={startDate}>{startDate}</time> ? Return <time dateTime={endDate}>{endDate}</time></p>
          <Link className="font-semibold text-blue-700 underline dark:text-blue-300" href={`/?${catalogReturn}`}>
            Change rental dates
          </Link>
        </div>
      )}

      {/* Filter Component */}
      <VehicleFilter
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        totalResults={isLoading || requestFailed ? undefined : totalCount}
      />

      <p role="status" className="sr-only">{isLoading ? "Finding vehicles?" : ""}</p>

      {/* Grid of Results */}
      <div className="mt-8">
        {isLoading ? (
          <div aria-hidden="true" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-gray-200 animate-pulse dark:bg-gray-800"
              />
            ))}
          </div>
        ) : requestFailed ? (
          <div role="alert" className="rounded-xl border border-gray-200 p-8 text-center dark:border-gray-800">
            <h2 className="text-lg font-bold">Unable to load vehicles</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Your search filters are still set.</p>
            <Button className="mt-4" onClick={() => setAttempt((value) => value + 1)}>Retry</Button>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
              No vehicles matched your search
            </h3>
            <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
              {range ? "Try different dates or adjust your filters." : "Try adjusting your price range, fuel type, or clearing filters."}
            </p>
            <Button
              onClick={handleResetFilters}
              variant="outline"
              className="mt-5 text-xs font-semibold"
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} dateQuery={dateQuery} catalogQuery={catalogReturn} />
              ))}
            </div>

            {/* Catalog Pagination Controls */}
            {!isLoading && !requestFailed && totalCount > pageSize && (
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-xs font-semibold"
                >
                  Previous Page
                </Button>
                <span className="text-xs font-medium text-gray-500">
                  Page <strong className="text-gray-900 dark:text-white">{currentPage}</strong> of{" "}
                  <strong className="text-gray-900 dark:text-white">{Math.ceil(totalCount / pageSize)}</strong>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                  onClick={() => {
                    setCurrentPage((p) => p + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-xs font-semibold"
                >
                  Next Page
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-10 text-center">Loading fleet...</div>}>
      <VehiclesRoute />
    </Suspense>
  );
}

function VehiclesRoute() {
  const params = useSearchParams();
  return <VehiclesContent key={params.toString()} />;
}
