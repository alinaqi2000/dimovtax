import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { userSchema, userQuerySchema } from "@/lib/schemas"
import { rateLimit } from "@/lib/rate-limit"
import { requireAuth, requireRole, isAuthFailure } from "@/lib/auth-guard"
import { Prisma } from "@/generated/prisma/client"
import bcrypt from "bcryptjs"

const sortMap: Record<string, string> = {
  name: "name",
  email: "email",
  createdAt: "createdAt",
}

export async function GET(request: Request) {
  const limited = rateLimit(request)
  if (limited) return limited

  const auth = await requireAuth()
  if (isAuthFailure(auth)) return auth

  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams.entries())
  const parsed = userQuerySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { search, role, sort, order, page, limit } = parsed.data
  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const orderBy: Prisma.UserOrderByWithRelationInput = {
    [sortMap[sort] ?? "createdAt"]: order,
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
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
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function POST(request: Request) {
  const limited = rateLimit(request)
  if (limited) return limited

  const auth = await requireRole("admin")
  if (isAuthFailure(auth)) return auth

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
  if (!password) {
    return NextResponse.json(
      { error: "Password is required when creating a user", details: { fieldErrors: { password: ["Password is required"] } } },
      { status: 422 },
    )
  }

  const existing = await prisma.user.findUnique({ where: { email: rest.email } })
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { ...rest, password: passwordHash },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(user, { status: 201 })
}
