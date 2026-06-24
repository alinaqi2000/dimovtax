import { vi } from "vitest"

export const mockSession = {
  user: {
    id: "user-1",
    name: "Admin User",
    email: "admin@dimovtax.com",
    role: "admin",
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
}

export const mockMemberSession = {
  user: {
    id: "user-2",
    name: "Sarah Chen",
    email: "sarah@dimovtax.com",
    role: "member",
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
}

export const mockAuth = vi.fn().mockResolvedValue(mockSession)

export const mockUnauth = vi.fn().mockResolvedValue(null)

export const mockUser = {
  id: "user-1",
  name: "Admin User",
  email: "admin@dimovtax.com",
  role: "admin",
  password: "hashedpassword",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
}

export const mockMember = {
  id: "user-2",
  name: "Sarah Chen",
  email: "sarah@dimovtax.com",
  role: "member",
  password: "hashedpassword",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
}

export const mockProject = {
  id: "proj-1",
  name: "Website Redesign",
  description: "Complete overhaul of the marketing site",
  status: "active",
  deadline: new Date("2026-12-01"),
  budget: 25000,
  createdAt: new Date("2026-06-01"),
  updatedAt: new Date("2026-06-01"),
  ownerId: "user-1",
  assigneeId: "user-2",
  assignee: { id: "user-2", name: "Sarah Chen", email: "sarah@dimovtax.com", role: "member" },
  owner: { id: "user-1", name: "Admin User" },
}

export const mockProject2 = {
  id: "proj-2",
  name: "Mobile App MVP",
  description: "Build a cross-platform mobile app",
  status: "on_hold",
  deadline: new Date("2026-10-15"),
  budget: 50000,
  createdAt: new Date("2026-06-02"),
  updatedAt: new Date("2026-06-02"),
  ownerId: "user-1",
  assigneeId: "user-2",
  assignee: { id: "user-2", name: "Sarah Chen", email: "sarah@dimovtax.com", role: "member" },
  owner: { id: "user-1", name: "Admin User" },
}

export function createMockRequest(body?: unknown, url = "http://localhost/api") {
  return new Request(url, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}
