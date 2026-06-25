declare module "swagger-ui-dist" {
  interface SwaggerUIBundleOptions {
    url?: string
    spec?: Record<string, unknown>
    domNode?: HTMLElement
    docExpansion?: "list" | "full" | "none"
    filter?: boolean
    [key: string]: unknown
  }

  export function SwaggerUIBundle(options: SwaggerUIBundleOptions): unknown
  export const SwaggerUIStandalonePreset: unknown
  export const absolutePath: string
  export const getAbsoluteFSPath: string
}

declare module "swagger-ui-dist/swagger-ui.css"
