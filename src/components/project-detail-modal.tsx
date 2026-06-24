"use client"

import {
  Calendar,
  DollarSign,
  FolderKanban,
  Mail,
  Pencil,
  Trash2,
  User as UserIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { StatusBadge } from "@/components/status-badge"
import { cn, formatCurrency, formatDate, isOverdue } from "@/lib/utils"
import type { Project } from "@/lib/types"

interface ProjectDetailModalProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

function DetailRow({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card/50 p-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className={cn("mt-0.5 text-sm font-medium", className)}>{children}</div>
      </div>
    </div>
  )
}

export function ProjectDetailModal({
  project,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ProjectDetailModalProps) {
  if (!project) return null

  const overdue =
    project.status !== "completed" && isOverdue(project.deadline)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Header section */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={project.status} />
              {overdue && (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                  Overdue
                </span>
              )}
            </div>
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              {project.name}
            </h2>
            {project.description && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DetailRow icon={DollarSign} label="Budget">
            <span className="font-mono tabular-nums">{formatCurrency(project.budget)}</span>
          </DetailRow>

          <DetailRow
            icon={Calendar}
            label="Deadline"
            className={cn(overdue && "text-destructive")}
          >
            {formatDate(project.deadline)}
          </DetailRow>

          <DetailRow icon={UserIcon} label="Assigned to">
            {project.assignee?.name ?? "Unassigned"}
          </DetailRow>

          <DetailRow icon={FolderKanban} label="Created by">
            {project.owner?.name ?? "Unknown"}
          </DetailRow>
        </div>

        {/* Assignee contact */}
        {project.assignee && (
          <div className="flex items-center gap-3 rounded-lg border bg-card/50 p-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
              {project.assignee.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{project.assignee.name}</p>
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <Mail className="size-3" />
                {project.assignee.email}
              </p>
            </div>
          </div>
        )}

        {/* Meta footer */}
        <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
          <span>Created {formatDate(project.createdAt)}</span>
          <span>Updated {formatDate(project.updatedAt)}</span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onOpenChange(false)
              onDelete(project)
            }}
          >
            <Trash2 />
            Delete
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onOpenChange(false)
              onEdit(project)
            }}
          >
            <Pencil />
            Edit project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
