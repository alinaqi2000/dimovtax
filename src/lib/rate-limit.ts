import { NextResponse } from "next/server"

interface RateLimitEntry {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()
const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 60 // 60 requests per minute per IP

// Clean up expired entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now > entry.resetTime) {
        store.delete(key)
      }
    }
  }, 60_000).unref?.()
}

export function rateLimit(req: Request): NextResponse | null {
  const headers = req.headers
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"

  const now = Date.now()
  const key = `rl:${ip}`
  const entry = store.get(key)

  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + WINDOW_MS })
    return null
  }

  entry.count++

  if (entry.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(MAX_REQUESTS),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetTime / 1000)),
        },
      },
    )
  }

  return null
}
