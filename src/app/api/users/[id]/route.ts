import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { userSchema } from "@/lib/schemas"
import { rateLimit } from "@/lib/rate-limit"
import { requireAuth, requireRole, isAuthFailure } from "@/lib/auth-guard"
import bcrypt from "bcryptjs"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit(request)
  if (limited) return limited

  const auth = await requireAuth()
  if (isAuthFailure(auth)) return auth

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { assignedProjects: true, ownedProjects: true },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit(request)
  if (limited) return limited

  const auth = await requireRole("admin")
  if (isAuthFailure(auth)) return auth

  const { id } = await params
  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = userSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { password, ...rest } = parsed.data

  if (rest.email) {
    const conflict = await prisma.user.findFirst({
      where: { email: rest.email, NOT: { id } },
    })
    if (conflict) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }
  }

  const data: Record<string, unknown> = { ...rest }
  if (password) {
    data.password = await bcrypt.hash(password, 10)
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(user)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit(request)
  if (limited) return limited

  const auth = await requireRole("admin")
  if (isAuthFailure(auth)) return auth

  const { id } = await params

  if (auth.user.id === id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 },
    )
  }

  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const assignedCount = await prisma.project.count({ where: { assigneeId: id } })
  if (assignedCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete user with ${assignedCount} assigned project(s). Reassign first.` },
      { status: 409 },
    )
  }

  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
