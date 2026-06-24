import type { Metadata } from "next"
import { UserDashboard } from "@/components/user-dashboard"

export const metadata: Metadata = {
  title: "Users — DimovTax",
}

export default function UsersPage() {
  return <UserDashboard />
}
