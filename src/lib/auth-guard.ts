import { NextResponse } from "next/server"
import { auth } from "@/auth"

export interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  role: string
}

export interface AuthResult {
  user: SessionUser
}

/**
 * Returns the authenticated session user, or a 401 response if unauthenticated.
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return { user: session.user as SessionUser }
}

/**
 * Returns the authenticated session user only if they have the given role,
 * otherwise a 403 response. Also returns 401 if unauthenticated.
 */
export async function requireRole(
  role: "admin" | "member",
): Promise<AuthResult | NextResponse> {
  const result = await requireAuth()
  if (result instanceof NextResponse) return result
  if (result.user.role !== role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return result
}

/**
 * True when the value is a NextResponse (i.e. an auth failure).
 */
export function isAuthFailure(
  result: AuthResult | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse
}
