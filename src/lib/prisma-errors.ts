import { Prisma } from "@/generated/prisma/client"

/**
 * Map a Prisma error to a user-friendly message and HTTP status.
 * Returns `null` when the error is not a recognised Prisma error so the
 * caller can fall back to a generic 500.
 */
export function handlePrismaError(
  err: unknown,
  entity: string,
): { status: number; error: string } | null {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      // P2002 — unique constraint violation
      case "P2002":
        return {
          status: 409,
          error: `A ${entity} with these details already exists.`,
        }
      // P2003 — foreign key constraint violation.
      case "P2003": {
        const msg = err.message
        if (msg.includes("ownerId")) {
          return {
            status: 401,
            error: "Your session has expired. Redirecting to login…",
          }
        }
        if (msg.includes("assigneeId")) {
          return {
            status: 400,
            error: "The selected assignee does not exist. Please choose a valid team member.",
          }
        }
        return {
          status: 400,
          error: `A referenced ${entity} does not exist. Please check your selection.`,
        }
      }
      // P2025 — record not found
      case "P2025":
        return {
          status: 404,
          error: `${entity.charAt(0).toUpperCase() + entity.slice(1)} not found.`,
        }
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return {
      status: 400,
      error: `Invalid data provided for the ${entity}.`,
    }
  }

  return null
}
