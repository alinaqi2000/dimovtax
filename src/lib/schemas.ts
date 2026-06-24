import { z } from "zod"

export const projectStatuses = ["active", "on_hold", "completed"] as const
export const userRoles = ["admin", "member"] as const

export const projectSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional().nullable(),
  status: z.enum(projectStatuses).default("active"),
  deadline: z.string().min(1, "Deadline is required"),
  assigneeId: z.string().min(1, "Assignee is required"),
  budget: z.coerce.number().min(0, "Budget must be a positive number"),
})

export type ProjectInput = z.infer<typeof projectSchema>

export const projectQuerySchema = z.object({
  status: z.enum(projectStatuses).optional(),
  search: z.string().optional(),
  assigneeId: z.string().optional(),
  sort: z.enum(["name", "deadline", "budget", "status", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export type ProjectQuery = z.infer<typeof projectQuerySchema>

export const userSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  email: z.string().email("Invalid email address"),
  role: z.enum(userRoles).default("member"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
})

export type UserInput = z.infer<typeof userSchema>

export const userQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(userRoles).optional(),
  sort: z.enum(["name", "email", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export type UserQuery = z.infer<typeof userQuerySchema>

// ─────────────────────────────────────────────────────────────
// Client-side form schemas
// Form state keeps numeric/date inputs as strings, so these schemas
// validate the raw input the user sees rather than coerced values.
// ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export type LoginInput = z.infer<typeof loginSchema>

export const projectFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(120, "Name must be at most 120 characters"),
  description: z.string().max(500, "Description must be at most 500 characters"),
  status: z.enum(projectStatuses),
  deadline: z.string().min(1, "Deadline is required"),
  assigneeId: z.string().min(1, "Assignee is required"),
  budget: z
    .string()
    .min(1, "Budget is required")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Budget must be a positive number"),
})

export type ProjectFormInput = z.infer<typeof projectFormSchema>

const userFormBase = {
  name: z
    .string()
    .min(1, "Name is required")
    .max(80, "Name must be at most 80 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  role: z.enum(userRoles),
}

/**
 * User form schema. On create, a password of at least 8 chars is required.
 * On edit, password is optional (leave blank to keep the existing one).
 */
export function userFormSchema(isCreate: boolean) {
  return z.object({
    ...userFormBase,
    password: isCreate
      ? z.string().min(8, "Password must be at least 8 characters")
      : z
          .string()
          .min(8, "Password must be at least 8 characters")
          .or(z.literal("")),
  })
}

export type UserFormInput = z.infer<ReturnType<typeof userFormSchema>>
