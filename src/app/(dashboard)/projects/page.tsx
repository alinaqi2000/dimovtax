import type { Metadata } from "next"
import { ProjectDashboard } from "@/components/project-dashboard"

export const metadata: Metadata = {
  title: "Projects — DimovTax",
}

export default function ProjectsPage() {
  return <ProjectDashboard />
}
