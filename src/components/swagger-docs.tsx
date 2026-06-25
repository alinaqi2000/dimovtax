"use client"

import { useEffect, useRef } from "react"
import { SwaggerUIBundle } from "swagger-ui-dist"
import "swagger-ui-dist/swagger-ui.css"

export function SwaggerDocs() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    SwaggerUIBundle({
      url: "/openapi.json",
      domNode: el,
      docExpansion: "list",
      filter: true,
    })

    return () => {
      // Swagger UI doesn't expose a clean teardown; clearing the DOM node
      // prevents duplicate instances on StrictMode double-mount.
      el.innerHTML = ""
    }
  }, [])

  return <div ref={containerRef} className="swagger-wrapper" />
}
