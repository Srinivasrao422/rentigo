import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "INR"): string {
  const locale = currency === "INR" || currency === "₹" ? "en-IN" : "en-US";
  const currCode = currency === "₹" ? "INR" : currency;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString("en-IN")}`;
  }
}

export function formatDate(dateString: string | Date): string {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getStatusBadge(status: string) {
  switch (status) {
    case "APPROVED":
    case "COMPLETED":
    case "AVAILABLE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400";
    case "PENDING":
    case "SCHEDULED":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400";
    case "ACTIVE":
    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400";
    case "REJECTED":
    case "CANCELLED":
    case "UNAVAILABLE":
    case "MAINTENANCE":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-400";
  }
}
