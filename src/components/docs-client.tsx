"use client"

import dynamic from "next/dynamic"

const SwaggerDocs = dynamic(
  () => import("@/components/swagger-docs").then((m) => m.SwaggerDocs),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        Loading API documentation…
      </div>
    ),
  },
)

export function DocsClient() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <SwaggerDocs />
    </div>
  )
}
