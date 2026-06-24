"use client"

import { useCallback, useState } from "react"
import type { ZodType } from "zod"

type FieldErrors<T> = Partial<Record<keyof T, string>>

/**
 * Reusable client-side form validation backed by a zod schema.
 *
 * - `validate(data)` runs the schema and stores the resulting field errors.
 *   Returns true when valid. Call this on change (live) and on submit.
 * - `touch(field)` marks a field as interacted with so its error only shows
 *   after the user leaves it (or after a submit attempt).
 * - `showError(field)` returns the error message to display, or undefined
 *   when the field is untouched and no submit has been attempted.
 * - `setFieldErrors(errors)` merges server-returned field errors (e.g. a
 *   duplicate email that can't be known client-side) and forces them visible.
 * - `reset()` clears all state — call when opening the form for a new record.
 */
export function useFormValidation<T extends Record<string, unknown>>(
  schema: ZodType<T>,
) {
  const [errors, setErrors] = useState<FieldErrors<T>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const validate = useCallback(
    (data: unknown): boolean => {
      const result = schema.safeParse(data)
      if (result.success) {
        setErrors({})
        return true
      }
      const fieldErrors: FieldErrors<T> = {}
      for (const [key, messages] of Object.entries(
        result.error.flatten().fieldErrors,
      )) {
        if (Array.isArray(messages) && messages.length > 0) {
          fieldErrors[key as keyof T] = messages[0] as string
        }
      }
      setErrors(fieldErrors)
      return false
    },
    [schema],
  )

  const touch = useCallback((field: keyof T) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }))
  }, [])

  const showError = useCallback(
    (field: keyof T): string | undefined => {
      if ((touched[field] || submitAttempted) && errors[field]) {
        return errors[field]
      }
      return undefined
    },
    [touched, submitAttempted, errors],
  )

  const setFieldErrors = useCallback((next: FieldErrors<T>) => {
    setErrors(next)
    setSubmitAttempted(true)
  }, [])

  const reset = useCallback(() => {
    setErrors({})
    setTouched({})
    setSubmitAttempted(false)
  }, [])

  return {
    validate,
    touch,
    showError,
    setFieldErrors,
    reset,
    submitAttempted,
    setSubmitAttempted,
  }
}
