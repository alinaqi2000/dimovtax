"use client"

import { useEffect, useState } from "react"
import { Activity, AlertTriangle, CheckCircle2, Clock, DollarSign, FolderKanban } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

interface Stats {
  total: number
  active: number
  onHold: number
  completed: number
  overdue: number
  totalBudget: number
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  accent: string
  delay: number
}

function StatCard({ label, value, icon: Icon, accent, delay }: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-4 transition-all hover:shadow-md",
        "animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110",
            accent,
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  )
}

interface ProjectStatsProps {
  /** Increment to force a re-fetch (e.g. after a project mutation). */
  refreshKey?: number
}

export function ProjectStats({ refreshKey = 0 }: ProjectStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch("/api/projects/stats")
      .then((r) => r.json())
      .then((data) => {
        if (active) setStats(data)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [refreshKey])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-7 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard
        label="Total"
        value={stats.total}
        icon={FolderKanban}
        accent="bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        delay={0}
      />
      <StatCard
        label="Active"
        value={stats.active}
        icon={Activity}
        accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        delay={50}
      />
      <StatCard
        label="On Hold"
        value={stats.onHold}
        icon={Clock}
        accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        delay={100}
      />
      <StatCard
        label="Completed"
        value={stats.completed}
        icon={CheckCircle2}
        accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        delay={150}
      />
      <StatCard
        label="Overdue"
        value={stats.overdue}
        icon={AlertTriangle}
        accent="bg-red-500/10 text-red-600 dark:text-red-400"
        delay={200}
      />
      <StatCard
        label="Total Budget"
        value={formatCurrency(stats.totalBudget, { compact: true })}
        icon={DollarSign}
        accent="bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        delay={250}
      />
    </div>
  )
}
