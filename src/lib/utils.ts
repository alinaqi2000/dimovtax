import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: string | number, options?: { compact?: boolean }): string {
  const num = typeof value === "string" ? parseFloat(value) : value
  if (Number.isNaN(num)) return "$0"

  // For large amounts (millions/billions) use compact notation so the stat
  // cards don't overflow: $1.2M, $3.4B, etc.
  if (options?.compact && Math.abs(num) >= 1_000_000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(num)
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

export function isOverdue(deadline: string | Date): boolean {
  const date = typeof deadline === "string" ? new Date(deadline) : deadline
  return date.getTime() < Date.now()
}
