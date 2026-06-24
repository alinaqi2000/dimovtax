import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { projectSchema, projectQuerySchema } from "@/lib/schemas"
import { rateLimit } from "@/lib/rate-limit"
import { requireAuth, isAuthFailure } from "@/lib/auth-guard"
import { Prisma } from "@/generated/prisma/client"

const sortMap: Record<string, string> = {
  name: "name",
  deadline: "deadline",
  budget: "budget",
  status: "status",
  createdAt: "createdAt",
}

export async function GET(request: Request) {
  const limited = rateLimit(request)
  if (limited) return limited

  const auth = await requireAuth()
  if (isAuthFailure(auth)) return auth

  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams.entries())
  const parsed = projectQuerySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { status, search, assigneeId, sort, order, page, limit } = parsed.data
  const where: Prisma.ProjectWhereInput = {
    ...(status ? { status } : {}),
    ...(assigneeId ? { assigneeId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const orderBy: Prisma.ProjectOrderByWithRelationInput = {
    [sortMap[sort] ?? "createdAt"]: order,
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        assignee: { select: { id: true, name: true, email: true, role: true } },
        owner: { select: { id: true, name: true } },
      },
    }),
    prisma.project.count({ where }),
  ])

  return NextResponse.json({
    data: projects,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function POST(request: Request) {
  const limited = rateLimit(request)
  if (limited) return limited

  const auth = await requireAuth()
  if (isAuthFailure(auth)) return auth

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = projectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { deadline, ...rest } = parsed.data
  const project = await prisma.project.create({
    data: {
      ...rest,
      deadline: new Date(deadline),
      ownerId: auth.user.id,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true, role: true } },
    },
  })

  return NextResponse.json(project, { status: 201 })
}
