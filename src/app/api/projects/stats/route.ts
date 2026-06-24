import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import { requireAuth, isAuthFailure } from "@/lib/auth-guard"

export async function GET(request: Request) {
  const limited = rateLimit(request)
  if (limited) return limited

  const auth = await requireAuth()
  if (isAuthFailure(auth)) return auth

  const [total, active, onHold, completed, budgetResult, overdue] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: "active" } }),
    prisma.project.count({ where: { status: "on_hold" } }),
    prisma.project.count({ where: { status: "completed" } }),
    prisma.project.aggregate({ _sum: { budget: true } }),
    prisma.project.count({
      where: {
        status: { not: "completed" },
        deadline: { lt: new Date() },
      },
    }),
  ])

  return NextResponse.json({
    total,
    active,
    onHold,
    completed,
    overdue,
    totalBudget: budgetResult._sum.budget ?? 0,
  })
}
