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
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string
      meta?: Record<string, unknown>
      constructor(message: string, { code }: { code: string }) {
        super(message)
        this.name = "PrismaClientKnownRequestError"
        this.code = code
      }
    },
    PrismaClientValidationError: class PrismaClientValidationError extends Error {
      constructor(message: string) {
        super(message)
        this.name = "PrismaClientValidationError"
      }
    },
  },
}))

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { GET, POST } from "@/app/api/projects/route"
import { GET as GET_ID, PUT, DELETE } from "@/app/api/projects/[id]/route"
import { mockSession, mockProject, mockProject2, createMockRequest } from "@/test/mocks"

const mockAuth = vi.mocked(auth)
const mockFindMany = vi.mocked(prisma.project.findMany)
const mockCount = vi.mocked(prisma.project.count)
const mockCreate = vi.mocked(prisma.project.create)
const mockFindUnique = vi.mocked(prisma.project.findUnique)
const mockUpdate = vi.mocked(prisma.project.update)
const mockDelete = vi.mocked(prisma.project.delete)

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue(mockSession)
})

describe("GET /api/projects", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(createMockRequest(undefined, "http://localhost/api/projects"))
    expect(res.status).toBe(401)
  })

  it("returns paginated projects for authenticated user", async () => {
    mockFindMany.mockResolvedValue([mockProject, mockProject2])
    mockCount.mockResolvedValue(2)

    const res = await GET(createMockRequest(undefined, "http://localhost/api/projects?page=1&limit=10"))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data).toHaveLength(2)
    expect(json.data[0].name).toBe("Website Redesign")
    expect(json.pagination.total).toBe(2)
    expect(json.pagination.totalPages).toBe(1)
  })

  it("applies status filter", async () => {
    mockFindMany.mockResolvedValue([mockProject])
    mockCount.mockResolvedValue(1)

    await GET(createMockRequest(undefined, "http://localhost/api/projects?status=active"))

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "active" }),
      }),
    )
  })

  it("applies search filter", async () => {
    mockFindMany.mockResolvedValue([])
    mockCount.mockResolvedValue(0)

    await GET(createMockRequest(undefined, "http://localhost/api/projects?search=website"))

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: expect.objectContaining({ contains: "website" }) }),
          ]),
        }),
      }),
    )
  })

  it("applies assignee filter", async () => {
    mockFindMany.mockResolvedValue([mockProject])
    mockCount.mockResolvedValue(1)

    await GET(createMockRequest(undefined, "http://localhost/api/projects?assigneeId=user-2"))

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ assigneeId: "user-2" }),
      }),
    )
  })

  it("combines status and assignee filters", async () => {
    mockFindMany.mockResolvedValue([])
    mockCount.mockResolvedValue(0)

    await GET(
      createMockRequest(
        undefined,
        "http://localhost/api/projects?status=active&assigneeId=user-2",
      ),
    )

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "active",
          assigneeId: "user-2",
        }),
      }),
    )
  })

  it("applies sorting", async () => {
    mockFindMany.mockResolvedValue([])
    mockCount.mockResolvedValue(0)

    await GET(createMockRequest(undefined, "http://localhost/api/projects?sort=name&order=asc"))

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: "asc" },
      }),
    )
  })

  it("applies pagination", async () => {
    mockFindMany.mockResolvedValue([])
    mockCount.mockResolvedValue(0)

    await GET(createMockRequest(undefined, "http://localhost/api/projects?page=3&limit=5"))

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 5,
      }),
    )
  })

  it("returns 400 for invalid query params", async () => {
    const res = await GET(createMockRequest(undefined, "http://localhost/api/projects?page=abc"))
    expect(res.status).toBe(400)
  })
})

describe("POST /api/projects", () => {
  const validBody = {
    name: "New Project",
    description: "A test project",
    status: "active",
    deadline: "2026-12-01",
    assigneeId: "user-2",
    budget: 30000,
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(createMockRequest(validBody, "http://localhost/api/projects"))
    expect(res.status).toBe(401)
  })

  it("creates a project with valid data", async () => {
    mockCreate.mockResolvedValue({ ...mockProject, name: "New Project" })

    const res = await POST(createMockRequest(validBody, "http://localhost/api/projects"))
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.name).toBe("New Project")
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "New Project",
          assigneeId: "user-2",
          ownerId: "user-1",
        }),
      }),
    )
  })

  it("returns 422 for missing name", async () => {
    const res = await POST(
      createMockRequest({ ...validBody, name: "" }, "http://localhost/api/projects"),
    )
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.error).toBe("Validation failed")
  })

  it("returns 422 for missing assigneeId", async () => {
    const res = await POST(
      createMockRequest({ ...validBody, assigneeId: "" }, "http://localhost/api/projects"),
    )
    expect(res.status).toBe(422)
  })

  it("returns 422 for negative budget", async () => {
    const res = await POST(
      createMockRequest({ ...validBody, budget: -100 }, "http://localhost/api/projects"),
    )
    expect(res.status).toBe(422)
  })

  it("returns 422 for budget exceeding the maximum", async () => {
    const res = await POST(
      createMockRequest({ ...validBody, budget: 10_000_000_000 }, "http://localhost/api/projects"),
    )
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.error).toBe("Validation failed")
  })

  it("returns 400 with a friendly message on assignee foreign key violation", async () => {
    const { Prisma } = await import("@/generated/prisma/client")
    mockCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        "Foreign key constraint violated on the constraint: `Project_assigneeId_fkey`",
        { code: "P2003" },
      ),
    )
    const res = await POST(createMockRequest(validBody, "http://localhost/api/projects"))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("assignee")
  })

  it("returns 401 on owner foreign key violation (stale session)", async () => {
    const { Prisma } = await import("@/generated/prisma/client")
    mockCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        "Foreign key constraint violated on the constraint: `Project_ownerId_fkey`",
        { code: "P2003" },
      ),
    )
    const res = await POST(createMockRequest(validBody, "http://localhost/api/projects"))
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toContain("expired")
  })

  it("returns 500 on an unexpected database error", async () => {
    mockCreate.mockRejectedValue(new Error("unexpected db failure"))
    const res = await POST(createMockRequest(validBody, "http://localhost/api/projects"))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toContain("Failed to create project")
  })

  it("returns 422 for invalid status", async () => {
    const res = await POST(
      createMockRequest({ ...validBody, status: "invalid" }, "http://localhost/api/projects"),
    )
    expect(res.status).toBe(422)
  })

  it("returns 400 for invalid JSON", async () => {
    const res = await POST(new Request("http://localhost/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    }))
    expect(res.status).toBe(400)
  })
})

describe("GET /api/projects/:id", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET_ID(createMockRequest(), { params: Promise.resolve({ id: "proj-1" }) })
    expect(res.status).toBe(401)
  })

  it("returns a project by id", async () => {
    mockFindUnique.mockResolvedValue(mockProject)

    const res = await GET_ID(createMockRequest(), { params: Promise.resolve({ id: "proj-1" }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.id).toBe("proj-1")
    expect(json.name).toBe("Website Redesign")
  })

  it("returns 404 for non-existent project", async () => {
    mockFindUnique.mockResolvedValue(null)

    const res = await GET_ID(createMockRequest(), { params: Promise.resolve({ id: "missing" }) })
    expect(res.status).toBe(404)
  })
})

describe("PUT /api/projects/:id", () => {
  const validBody = {
    name: "Updated Project",
    description: "Updated description",
    status: "completed",
    deadline: "2026-11-01",
    assigneeId: "user-2",
    budget: 40000,
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await PUT(createMockRequest(validBody), { params: Promise.resolve({ id: "proj-1" }) })
    expect(res.status).toBe(401)
  })

  it("updates a project with valid data", async () => {
    mockFindUnique.mockResolvedValue(mockProject)
    mockUpdate.mockResolvedValue({ ...mockProject, name: "Updated Project" })

    const res = await PUT(createMockRequest(validBody), { params: Promise.resolve({ id: "proj-1" }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.name).toBe("Updated Project")
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "proj-1" },
        data: expect.objectContaining({ name: "Updated Project" }),
      }),
    )
  })

  it("returns 404 when updating a non-existent project", async () => {
    mockFindUnique.mockResolvedValue(null)

    const res = await PUT(createMockRequest(validBody), { params: Promise.resolve({ id: "missing" }) })
    expect(res.status).toBe(404)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it("returns 422 for invalid data", async () => {
    mockFindUnique.mockResolvedValue(mockProject)
    const res = await PUT(
      createMockRequest({ ...validBody, name: "" }),
      { params: Promise.resolve({ id: "proj-1" }) },
    )
    expect(res.status).toBe(422)
  })

  it("returns 400 for invalid JSON", async () => {
    mockFindUnique.mockResolvedValue(mockProject)
    const res = await PUT(
      new Request("http://localhost/api/projects/proj-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }),
      { params: Promise.resolve({ id: "proj-1" }) },
    )
    expect(res.status).toBe(400)
  })

  it("returns 400 with a friendly message on assignee FK violation during update", async () => {
    const { Prisma } = await import("@/generated/prisma/client")
    mockFindUnique.mockResolvedValue(mockProject)
    mockUpdate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        "Foreign key constraint violated on the constraint: `Project_assigneeId_fkey`",
        { code: "P2003" },
      ),
    )
    const res = await PUT(createMockRequest(validBody), { params: Promise.resolve({ id: "proj-1" }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("assignee")
  })

  it("returns 500 on an unexpected database error during update", async () => {
    mockFindUnique.mockResolvedValue(mockProject)
    mockUpdate.mockRejectedValue(new Error("unexpected db failure"))
    const res = await PUT(createMockRequest(validBody), { params: Promise.resolve({ id: "proj-1" }) })
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toContain("Failed to update project")
  })
})

describe("DELETE /api/projects/:id", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await DELETE(createMockRequest(), { params: Promise.resolve({ id: "proj-1" }) })
    expect(res.status).toBe(401)
  })

  it("deletes a project successfully", async () => {
    mockFindUnique.mockResolvedValue(mockProject)
    mockDelete.mockResolvedValue(mockProject)

    const res = await DELETE(createMockRequest(), { params: Promise.resolve({ id: "proj-1" }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "proj-1" } })
  })

  it("returns 404 when deleting a non-existent project", async () => {
    mockFindUnique.mockResolvedValue(null)

    const res = await DELETE(createMockRequest(), { params: Promise.resolve({ id: "missing" }) })
    expect(res.status).toBe(404)
    expect(mockDelete).not.toHaveBeenCalled()
  })
})
