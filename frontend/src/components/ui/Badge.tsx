import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-blue-100 text-blue-800 border-transparent dark:bg-blue-900/40 dark:text-blue-300",
    secondary: "bg-gray-100 text-gray-800 border-transparent dark:bg-gray-800 dark:text-gray-300",
    outline: "text-gray-800 border-gray-300 dark:text-gray-200 dark:border-gray-700",
    success: "bg-emerald-100 text-emerald-800 border-transparent dark:bg-emerald-950/50 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-800 border-transparent dark:bg-amber-950/50 dark:text-amber-300",
    danger: "bg-red-100 text-red-800 border-transparent dark:bg-red-950/50 dark:text-red-300",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
