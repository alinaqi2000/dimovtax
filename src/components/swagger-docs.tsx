"use client"

import SwaggerUI from "swagger-ui-react"
import "swagger-ui-react/swagger-ui.css"

export function SwaggerDocs() {
  return (
    <div className="swagger-wrapper">
      <SwaggerUI url="/openapi.json" />
    </div>
  )
}
