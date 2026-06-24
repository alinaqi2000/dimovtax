export type ProjectStatus = "active" | "on_hold" | "completed"
export type UserRole = "admin" | "member"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface UserWithStats extends User {
  _count: {
    assignedProjects: number
    ownedProjects: number
  }
}

export interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  deadline: string
  budget: string
  createdAt: string
  updatedAt: string
  ownerId: string | null
  assigneeId: string
  assignee?: User | null
  owner?: User | null
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  member: "Member",
}
