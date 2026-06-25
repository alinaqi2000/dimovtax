import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { projectSchema } from "@/lib/schemas"
import { rateLimit } from "@/lib/rate-limit"
import { requireAuth, isAuthFailure } from "@/lib/auth-guard"
import { handlePrismaError } from "@/lib/prisma-errors"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit(request)
  if (limited) return limited

  const auth = await requireAuth()
  if (isAuthFailure(auth)) return auth

  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true, role: true } },
      owner: { select: { id: true, name: true } },
    },
  })

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  return NextResponse.json(project)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit(request)
  if (limited) return limited

  const auth = await requireAuth()
  if (isAuthFailure(auth)) return auth

  const { id } = await params
  const existing = await prisma.project.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

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
  try {
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...rest,
        deadline: new Date(deadline),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    return NextResponse.json(project)
  } catch (err) {
    console.error("PUT /api/projects/:id — update failed:", err)
    const handled = handlePrismaError(err, "project")
    if (handled) return NextResponse.json({ error: handled.error }, { status: handled.status })
    return NextResponse.json(
      { error: "Failed to update project. Please try again." },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit(request)
  if (limited) return limited

  const auth = await requireAuth()
  if (isAuthFailure(auth)) return auth

  const { id } = await params
  const existing = await prisma.project.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  await prisma.project.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
