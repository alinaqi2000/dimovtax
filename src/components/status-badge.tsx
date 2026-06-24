import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ProjectStatus } from "@/lib/types"
import { STATUS_LABELS } from "@/lib/types"

const statusStyles: Record<ProjectStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  on_hold: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  completed: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge variant="outline" className={cn("border", statusStyles[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
