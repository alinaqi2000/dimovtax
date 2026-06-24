"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User, UserRole } from "@/lib/types"
import { ROLE_LABELS } from "@/lib/types"
import { userFormSchema } from "@/lib/schemas"
import { useFormValidation } from "@/lib/use-form-validation"

interface UserFormProps {
  user?: User | null
  onSaved: () => void
  onCancel: () => void
}

type UserFormState = {
  name: string
  email: string
  role: UserRole
  password: string
}

export function UserForm({ user, onSaved, onCancel }: UserFormProps) {
  const [saving, setSaving] = useState(false)
  const isCreate = !user
  const validation = useFormValidation<UserFormState>(userFormSchema(isCreate))

  const [form, setForm] = useState<UserFormState>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "member",
    password: "",
  })

  function update<K extends keyof UserFormState>(key: K, value: UserFormState[K]) {
    const next = { ...form, [key]: value }
    setForm(next)
    validation.validate(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    validation.setSubmitAttempted(true)
    if (!validation.validate(form)) return

    setSaving(true)

    const url = user ? `/api/users/${user.id}` : "/api/users"
    const body: Record<string, unknown> = { name: form.name, email: form.email, role: form.role }
    if (form.password) body.password = form.password

    const res = await fetch(url, {
      method: user ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      if (data.details?.fieldErrors) {
        const fieldErrors: Record<string, string> = {}
        for (const [key, val] of Object.entries(data.details.fieldErrors)) {
          if (Array.isArray(val) && val.length > 0) fieldErrors[key] = val[0]
        }
        validation.setFieldErrors(fieldErrors)
      }
      toast.error(data.error ?? "Something went wrong")
      setSaving(false)
      return
    }

    toast.success(user ? "User updated" : "User created")
    setSaving(false)
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          onBlur={() => validation.touch("name")}
          placeholder="Jane Doe"
          aria-invalid={!!validation.showError("name")}
        />
        {validation.showError("name") && (
          <p className="text-xs text-destructive">{validation.showError("name")}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          onBlur={() => validation.touch("email")}
          placeholder="jane@dimovtax.com"
          aria-invalid={!!validation.showError("email")}
        />
        {validation.showError("email") && (
          <p className="text-xs text-destructive">{validation.showError("email")}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role">Role</Label>
          <Select
            value={form.role}
            onValueChange={(v) => {
              update("role", (v ?? "member") as UserRole)
              validation.touch("role")
            }}
          >
            <SelectTrigger id="role" className="w-full">
              <SelectValue>
                {(value: string) => ROLE_LABELS[value as UserRole]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">
            Password {user && <span className="text-muted-foreground">(leave blank to keep)</span>}
          </Label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            onBlur={() => validation.touch("password")}
            placeholder={user ? "••••••••" : "Min 8 characters"}
            aria-invalid={!!validation.showError("password")}
          />
          {validation.showError("password") && (
            <p className="text-xs text-destructive">{validation.showError("password")}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : user ? "Save changes" : "Create user"}
        </Button>
      </div>
    </form>
  )
}
