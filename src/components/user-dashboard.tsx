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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserForm } from "@/components/user-form"
import { formatDate } from "@/lib/utils"
import type { PaginatedResponse, User, UserWithStats, UserRole } from "@/lib/types"
import { ROLE_LABELS } from "@/lib/types"

type SortField = "name" | "email" | "createdAt"

export function UserDashboard() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all")
  const [sort, setSort] = useState<SortField>("createdAt")
  const [order, setOrder] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<UserWithStats | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (roleFilter !== "all") params.set("role", roleFilter)
    if (search) params.set("search", search)
    params.set("sort", sort)
    params.set("order", order)
    params.set("page", String(page))
    params.set("limit", "10")

    try {
      const res = await fetch(`/api/users?${params.toString()}`)
      if (res.ok) {
        const json: PaginatedResponse<UserWithStats> = await res.json()
        setUsers(json.data)
        setPagination(json.pagination)
      }
    } catch {
      // network error — keep existing data, surface nothing
    } finally {
      setLoading(false)
    }
  }, [roleFilter, search, sort, order, page])

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 200)
    return () => clearTimeout(timer)
  }, [fetchUsers])

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

  function openEdit(user: User) {
    setEditing(user)
    setDialogOpen(true)
  }

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    const res = await fetch(`/api/users/${confirmDelete.id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("User deleted")
      setConfirmDelete(null)
      fetchUsers()
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? "Failed to delete user")
    }
    setDeleting(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            {pagination.total} {pagination.total === 1 ? "user" : "users"} total
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus />
          New user
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
            placeholder="Search by name or email…"
            className="pl-9"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v as UserRole | "all")
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue>
              {(value: string) =>
                value === "all" ? "All roles" : ROLE_LABELS[value as UserRole]
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader field="name" label="Name" activeSort={sort} order={order} onSort={(f) => toggleSort(f as SortField)} />
              <SortHeader field="email" label="Email" activeSort={sort} order={order} onSort={(f) => toggleSort(f as SortField)} />
              <TableHead>Role</TableHead>
              <TableHead className="text-center">Assigned</TableHead>
              <TableHead className="text-center">Owned</TableHead>
              <SortHeader field="createdAt" label="Joined" activeSort={sort} order={order} onSort={(f) => toggleSort(f as SortField)} />
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-full max-w-32 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No users found. Try adjusting your filters.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="group">
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm tabular-nums">
                    {user._count.assignedProjects}
                  </TableCell>
                  <TableCell className="text-center text-sm tabular-nums">
                    {user._count.ownedProjects}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(user)}>
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setConfirmDelete(user)}
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
        ) : users.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            No users found. Try adjusting your filters.
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium">{user.name}</h3>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(user)}>
                      <Pencil />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setConfirmDelete(user)}
                    >
                      <Trash2 />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                  {ROLE_LABELS[user.role]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Joined {formatDate(user.createdAt)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Assigned</span>
                  <span className="text-sm tabular-nums">{user._count.assignedProjects}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-muted-foreground">Owned</span>
                  <span className="text-sm tabular-nums">{user._count.ownedProjects}</span>
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
            <DialogTitle>{editing ? "Edit user" : "New user"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the user details below."
                : "Add a new team member to the workspace."}
            </DialogDescription>
          </DialogHeader>
          <UserForm
            user={editing}
            onSaved={() => {
              setDialogOpen(false)
              fetchUsers()
            }}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{confirmDelete?.name}&rdquo;. If they have assigned
              projects, you&rsquo;ll need to reassign them first.
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
    </div>
  )
}
