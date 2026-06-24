import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock("@/generated/prisma/client", () => ({
  PrismaClient: vi.fn(),
}))

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashedpassword"),
    compare: vi.fn().mockResolvedValue(true),
  },
  hash: vi.fn().mockResolvedValue("hashedpassword"),
  compare: vi.fn().mockResolvedValue(true),
}))

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { GET, POST } from "@/app/api/users/route"
import { GET as GET_ID, PUT, DELETE } from "@/app/api/users/[id]/route"
import { mockSession, mockMemberSession, mockUser, createMockRequest } from "@/test/mocks"

const mockAuth = vi.mocked(auth)
const mockFindMany = vi.mocked(prisma.user.findMany)
const mockCount = vi.mocked(prisma.user.count)
const mockCreate = vi.mocked(prisma.user.create)
const mockFindUnique = vi.mocked(prisma.user.findUnique)
const mockFindFirst = vi.mocked(prisma.user.findFirst)
const mockUpdate = vi.mocked(prisma.user.update)
const mockDelete = vi.mocked(prisma.user.delete)
const mockProjectCount = vi.mocked(prisma.project.count)

const mockUserWithStats = {
  ...mockUser,
  password: undefined,
  _count: { assignedProjects: 3, ownedProjects: 1 },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue(mockSession)
})

describe("GET /api/users", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(createMockRequest(undefined, "http://localhost/api/users"))
    expect(res.status).toBe(401)
  })

  it("returns paginated users for authenticated user", async () => {
    mockFindMany.mockResolvedValue([mockUserWithStats])
    mockCount.mockResolvedValue(1)

    const res = await GET(createMockRequest(undefined, "http://localhost/api/users?page=1&limit=10"))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].name).toBe("Admin User")
    expect(json.data[0]._count.assignedProjects).toBe(3)
    expect(json.pagination.total).toBe(1)
  })

  it("applies role filter", async () => {
    mockFindMany.mockResolvedValue([])
    mockCount.mockResolvedValue(0)

    await GET(createMockRequest(undefined, "http://localhost/api/users?role=admin"))

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ role: "admin" }),
      }),
    )
  })

  it("applies search filter", async () => {
    mockFindMany.mockResolvedValue([])
    mockCount.mockResolvedValue(0)

    await GET(createMockRequest(undefined, "http://localhost/api/users?search=sarah"))

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: expect.objectContaining({ contains: "sarah" }) }),
          ]),
        }),
      }),
    )
  })

  it("applies sorting", async () => {
    mockFindMany.mockResolvedValue([])
    mockCount.mockResolvedValue(0)

    await GET(createMockRequest(undefined, "http://localhost/api/users?sort=email&order=asc"))

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { email: "asc" },
      }),
    )
  })

  it("does not expose password field", async () => {
    mockFindMany.mockResolvedValue([mockUserWithStats])

    await GET(createMockRequest(undefined, "http://localhost/api/users"))

    const callArg = mockFindMany.mock.calls[0][0] as Record<string, unknown>
    const select = callArg.select as Record<string, unknown>
    expect(select).toBeDefined()
    expect(select).not.toHaveProperty("password")
    expect(select.name).toBe(true)
    expect(select.email).toBe(true)
  })

  it("returns 400 for invalid query params", async () => {
    const res = await GET(createMockRequest(undefined, "http://localhost/api/users?page=abc"))
    expect(res.status).toBe(400)
  })
})

describe("POST /api/users", () => {
  const validBody = {
    name: "New Member",
    email: "new@dimovtax.com",
    role: "member",
    password: "securepass123",
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(createMockRequest(validBody, "http://localhost/api/users"))
    expect(res.status).toBe(401)
  })

  it("returns 403 when a non-admin creates a user", async () => {
    mockAuth.mockResolvedValue(mockMemberSession)
    const res = await POST(createMockRequest(validBody, "http://localhost/api/users"))
    expect(res.status).toBe(403)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("returns 422 when password is missing on create", async () => {
    const withoutPassword = { name: validBody.name, email: validBody.email, role: validBody.role }
    const res = await POST(
      createMockRequest(withoutPassword, "http://localhost/api/users"),
    )
    expect(res.status).toBe(422)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("creates a user with valid data", async () => {
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({
      id: "user-3",
      name: "New Member",
      email: "new@dimovtax.com",
      role: "member",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const res = await POST(createMockRequest(validBody, "http://localhost/api/users"))
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.name).toBe("New Member")
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "New Member",
          email: "new@dimovtax.com",
          role: "member",
          password: "hashedpassword",
        }),
      }),
    )
  })

  it("returns 409 when email already exists", async () => {
    mockFindUnique.mockResolvedValue(mockUser as never)

    const res = await POST(createMockRequest(validBody, "http://localhost/api/users"))
    expect(res.status).toBe(409)
  })

  it("returns 422 for invalid email", async () => {
    const res = await POST(
      createMockRequest({ ...validBody, email: "not-an-email" }, "http://localhost/api/users"),
    )
    expect(res.status).toBe(422)
  })

  it("returns 422 for short password", async () => {
    const res = await POST(
      createMockRequest({ ...validBody, password: "short" }, "http://localhost/api/users"),
    )
    expect(res.status).toBe(422)
  })

  it("returns 422 for missing name", async () => {
    const res = await POST(
      createMockRequest({ ...validBody, name: "" }, "http://localhost/api/users"),
    )
    expect(res.status).toBe(422)
  })

  it("returns 400 for invalid JSON", async () => {
    const res = await POST(new Request("http://localhost/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    }))
    expect(res.status).toBe(400)
  })
})

describe("GET /api/users/:id", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET_ID(createMockRequest(), { params: Promise.resolve({ id: "user-1" }) })
    expect(res.status).toBe(401)
  })

  it("returns a user by id with stats", async () => {
    mockFindUnique.mockResolvedValue(mockUserWithStats as never)

    const res = await GET_ID(createMockRequest(), { params: Promise.resolve({ id: "user-1" }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.id).toBe("user-1")
    expect(json._count.assignedProjects).toBe(3)
  })

  it("returns 404 for non-existent user", async () => {
    mockFindUnique.mockResolvedValue(null)

    const res = await GET_ID(createMockRequest(), { params: Promise.resolve({ id: "missing" }) })
    expect(res.status).toBe(404)
  })
})

describe("PUT /api/users/:id", () => {
  const validBody = {
    name: "Updated Name",
    email: "updated@dimovtax.com",
    role: "admin",
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await PUT(createMockRequest(validBody), { params: Promise.resolve({ id: "user-1" }) })
    expect(res.status).toBe(401)
  })

  it("returns 403 when a non-admin updates a user", async () => {
    mockAuth.mockResolvedValue(mockMemberSession)
    const res = await PUT(createMockRequest(validBody), { params: Promise.resolve({ id: "user-1" }) })
    expect(res.status).toBe(403)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it("returns 404 when updating a non-existent user", async () => {
    mockFindUnique.mockResolvedValue(null)
    const res = await PUT(createMockRequest(validBody), { params: Promise.resolve({ id: "missing" }) })
    expect(res.status).toBe(404)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it("updates a user with valid data", async () => {
    mockFindUnique.mockResolvedValue(mockUser as never)
    mockFindFirst.mockResolvedValue(null)
    mockUpdate.mockResolvedValue({
      id: "user-1",
      name: "Updated Name",
      email: "updated@dimovtax.com",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const res = await PUT(createMockRequest(validBody), { params: Promise.resolve({ id: "user-1" }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.name).toBe("Updated Name")
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({ name: "Updated Name" }),
      }),
    )
  })

  it("returns 409 when email is taken by another user", async () => {
    mockFindUnique.mockResolvedValue(mockUser as never)
    mockFindFirst.mockResolvedValue({ id: "user-2" } as never)

    const res = await PUT(createMockRequest(validBody), { params: Promise.resolve({ id: "user-1" }) })
    expect(res.status).toBe(409)
  })

  it("hashes password when provided", async () => {
    mockFindUnique.mockResolvedValue(mockUser as never)
    mockFindFirst.mockResolvedValue(null)
    mockUpdate.mockResolvedValue({ id: "user-1", name: "Updated", email: "test@test.com", role: "member", createdAt: new Date(), updatedAt: new Date() })

    await PUT(
      createMockRequest({ ...validBody, password: "newpassword123" }),
      { params: Promise.resolve({ id: "user-1" }) },
    )

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ password: "hashedpassword" }),
      }),
    )
  })

  it("returns 422 for invalid email", async () => {
    mockFindUnique.mockResolvedValue(mockUser as never)
    const res = await PUT(
      createMockRequest({ ...validBody, email: "bad" }),
      { params: Promise.resolve({ id: "user-1" }) },
    )
    expect(res.status).toBe(422)
  })
})

describe("DELETE /api/users/:id", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await DELETE(createMockRequest(), { params: Promise.resolve({ id: "user-2" }) })
    expect(res.status).toBe(401)
  })

  it("returns 403 when a non-admin deletes a user", async () => {
    mockAuth.mockResolvedValue(mockMemberSession)
    const res = await DELETE(createMockRequest(), { params: Promise.resolve({ id: "user-1" }) })
    expect(res.status).toBe(403)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it("prevents self-deletion", async () => {
    const res = await DELETE(createMockRequest(), { params: Promise.resolve({ id: "user-1" }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("own account")
  })

  it("returns 404 when deleting a non-existent user", async () => {
    mockFindUnique.mockResolvedValue(null)
    const res = await DELETE(createMockRequest(), { params: Promise.resolve({ id: "missing" }) })
    expect(res.status).toBe(404)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it("prevents deletion when user has assigned projects", async () => {
    mockFindUnique.mockResolvedValue(mockUser as never)
    mockProjectCount.mockResolvedValue(3)

    const res = await DELETE(createMockRequest(), { params: Promise.resolve({ id: "user-2" }) })
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toContain("3")
  })

  it("deletes a user with no assigned projects", async () => {
    mockFindUnique.mockResolvedValue(mockUser as never)
    mockProjectCount.mockResolvedValue(0)
    mockDelete.mockResolvedValue(mockUser as never)

    const res = await DELETE(createMockRequest(), { params: Promise.resolve({ id: "user-2" }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "user-2" } })
  })
})
