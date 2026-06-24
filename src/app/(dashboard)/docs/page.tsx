import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { DocsClient } from "@/components/docs-client"

export const metadata: Metadata = {
  title: "API Docs — DimovTax",
}

export default async function ApiDocsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/projects")
  }

  return <DocsClient />
}
