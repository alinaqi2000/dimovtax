"use client"

import { useCallback, useEffect, useState } from "react"
import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { SortHeader } from "@/components/sort-header"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { ProjectForm } from "@/components/project-form"
import { ProjectStats } from "@/components/project-stats"
import { ProjectDetailModal } from "@/components/project-detail-modal"
import { cn, formatCurrency, formatDate, isOverdue } from "@/lib/utils"
import type { PaginatedResponse, Project, ProjectStatus, User } from "@/lib/types"
import { STATUS_LABELS } from "@/lib/types"

type SortField = "name" | "deadline" | "budget" | "status" | "createdAt"

export function ProjectDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")
  const [users, setUsers] = useState<User[]>([])
  const [sort, setSort] = useState<SortField>("createdAt")
  const [order, setOrder] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null)
  const [detailProject, setDetailProject] = useState<Project | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [statsKey, setStatsKey] = useState(0)

  // Fetch the user list once for the assignee filter dropdown.
  useEffect(() => {
    fetch("/api/users?limit=100")
      .then((r) => r.json())
      .then((json) => setUsers(json.data ?? []))
      .catch(() => {})
  }, [])

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (assigneeFilter !== "all") params.set("assigneeId", assigneeFilter)
    if (search) params.set("search", search)
    params.set("sort", sort)
    params.set("order", order)
    params.set("page", String(page))
    params.set("limit", "10")

    try {
      const res = await fetch(`/api/projects?${params.toString()}`)
      if (res.ok) {
        const json: PaginatedResponse<Project> = await res.json()
        setProjects(json.data)
        setPagination(json.pagination)
      }
    } catch {
      // network error — keep existing data, surface nothing
    } finally {
      setLoading(false)
    }
  }, [statusFilter, assigneeFilter, search, sort, order, page])

  useEffect(() => {
    const timer = setTimeout(fetchProjects, 200)
    return () => clearTimeout(timer)
  }, [fetchProjects])

  /** Refresh both the project table and the stats cards after a mutation. */
  function refreshAll() {
    fetchProjects()
    setStatsKey((k) => k + 1)
  }

  function toggleSort(field: SortField) {
    if (sort === field) {
      setOrder(order === "asc" ? "desc" : "asc")
    } else {
      setSort(field)
      setOrder("asc")
    }
    setPage(1)
  }

  function openAdd() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(project: Project) {
    setEditing(project)
    setDialogOpen(true)
  }

  function openDetail(project: Project) {
    setDetailProject(project)
    setDetailOpen(true)
  }

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    const res = await fetch(`/api/projects/${confirmDelete.id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Project deleted")
      setConfirmDelete(null)
      refreshAll()
    } else {
      toast.error("Failed to delete project")
    }
    setDeleting(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <ProjectStats refreshKey={statsKey} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            {pagination.total} {pagination.total === 1 ? "project" : "projects"} total
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus />
          New project
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by name or description…"
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as ProjectStatus | "all")
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue>
              {(value: string) =>
                value === "all" ? "All statuses" : STATUS_LABELS[value as ProjectStatus]
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SearchableSelect
          value={assigneeFilter}
          onValueChange={(v) => {
            setAssigneeFilter(v)
            setPage(1)
          }}
          options={[
            { value: "all", label: "All assignees" },
            ...users.map((u) => ({ value: u.id, label: u.name, sublabel: u.email })),
          ]}
          placeholder="All assignees"
          searchPlaceholder="Search by name or email…"
          emptyText="No team members found."
          className="sm:w-56"
        />
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader field="name" label="Name" activeSort={sort} order={order} onSort={(f) => toggleSort(f as SortField)} />
              <SortHeader field="status" label="Status" activeSort={sort} order={order} onSort={(f) => toggleSort(f as SortField)} />
              <TableHead>Assignee</TableHead>
              <SortHeader field="deadline" label="Deadline" activeSort={sort} order={order} onSort={(f) => toggleSort(f as SortField)} />
              <SortHeader field="budget" label="Budget" activeSort={sort} order={order} onSort={(f) => toggleSort(f as SortField)} className="text-right" />
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-full max-w-32 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No projects found. Try adjusting your filters.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow
                  key={project.id}
                  className="group cursor-pointer transition-colors hover:bg-muted/40"
                  onClick={() => openDetail(project)}
                >
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{project.name}</span>
                      {project.description && (
                        <span className="line-clamp-1 max-w-72 text-xs text-muted-foreground">
                          {project.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={project.status} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {project.assignee?.name ?? "Unassigned"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-sm",
                        project.status !== "completed" &&
                          isOverdue(project.deadline) &&
                          "text-destructive font-medium",
                      )}
                    >
                      {formatDate(project.deadline)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {formatCurrency(project.budget)}
                  </TableCell>
                  <TableCell
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDetail(project)}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(project)}>
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setConfirmDelete(project)}
                        >
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          ))
        ) : projects.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            No projects found. Try adjusting your filters.
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="cursor-pointer rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40 active:bg-muted/60"
              onClick={() => openDetail(project)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium">{project.name}</h3>
                  {project.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openDetail(project)}>
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(project)}>
                        <Pencil />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setConfirmDelete(project)}
                      >
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={project.status} />
                <span className="text-xs text-muted-foreground">
                  {project.assignee?.name ?? "Unassigned"}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Deadline</span>
                  <span
                    className={cn(
                      "text-sm",
                      project.status !== "completed" &&
                        isOverdue(project.deadline) &&
                        "text-destructive font-medium",
                    )}
                  >
                    {formatDate(project.deadline)}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-muted-foreground">Budget</span>
                  <span className="font-mono text-sm tabular-nums">
                    {formatCurrency(project.budget)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit project" : "New project"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the project details below."
                : "Fill in the details to create a new project."}
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            project={editing}
            onSaved={() => {
              setDialogOpen(false)
              refreshAll()
            }}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{confirmDelete?.name}&rdquo;. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProjectDetailModal
        project={detailProject}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={openEdit}
        onDelete={setConfirmDelete}
      />
    </div>
  )
}
