"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Textarea } from "@/components/ui/textarea"
import type { Project, ProjectStatus, User } from "@/lib/types"
import { STATUS_LABELS } from "@/lib/types"
import { projectFormSchema } from "@/lib/schemas"
import { useFormValidation } from "@/lib/use-form-validation"

interface ProjectFormProps {
  project?: Project | null
  onSaved: () => void
  onCancel: () => void
}

type ProjectFormState = {
  name: string
  description: string
  status: ProjectStatus
  deadline: string
  assigneeId: string
  budget: string
}

export function ProjectForm({ project, onSaved, onCancel }: ProjectFormProps) {
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const validation = useFormValidation<ProjectFormState>(projectFormSchema)

  const [form, setForm] = useState<ProjectFormState>({
    name: project?.name ?? "",
    description: project?.description ?? "",
    status: project?.status ?? "active",
    deadline: project ? project.deadline.slice(0, 10) : "",
    assigneeId: project?.assigneeId ?? "",
    budget: project ? project.budget : "",
  })

  useEffect(() => {
    fetch("/api/users?limit=100")
      .then((r) => r.json())
      .then((json) => setUsers(json.data ?? []))
      .catch(() => {})
  }, [])

  function update<K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) {
    const next = { ...form, [key]: value }
    setForm(next)
    validation.validate(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    validation.setSubmitAttempted(true)
    if (!validation.validate(form)) return

    setSaving(true)

    const url = project ? `/api/projects/${project.id}` : "/api/projects"
    const res = await fetch(url, {
      method: project ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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

      if (res.status === 401) {
        try {
          const csrfRes = await fetch("/api/auth/csrf")
          const { csrfToken } = await csrfRes.json()
          await fetch("/api/auth/signout", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ csrfToken, callbackUrl: "/login" }),
          })
        } catch {
          // ignore — redirect will still happen
        }
        window.location.assign("/login")
      }
      setSaving(false)
      return
    }

    toast.success(project ? "Project updated" : "Project created")
    setSaving(false)
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Project name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          onBlur={() => validation.touch("name")}
          placeholder="Website redesign"
          aria-invalid={!!validation.showError("name")}
        />
        {validation.showError("name") && (
          <p className="text-xs text-destructive">{validation.showError("name")}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          onBlur={() => validation.touch("description")}
          placeholder="Short summary of the project scope"
          rows={3}
          aria-invalid={!!validation.showError("description")}
        />
        {validation.showError("description") && (
          <p className="text-xs text-destructive">{validation.showError("description")}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => {
              update("status", (v ?? "active") as ProjectStatus)
              validation.touch("status")
            }}
          >
            <SelectTrigger id="status" className="w-full">
              <SelectValue>
                {(value: string) => STATUS_LABELS[value as ProjectStatus]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            type="date"
            value={form.deadline}
            onChange={(e) => update("deadline", e.target.value)}
            onBlur={() => validation.touch("deadline")}
            aria-invalid={!!validation.showError("deadline")}
          />
          {validation.showError("deadline") && (
            <p className="text-xs text-destructive">{validation.showError("deadline")}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="assigneeId">Assigned to</Label>
          <SearchableSelect
            id="assigneeId"
            value={form.assigneeId}
            onValueChange={(v) => {
              update("assigneeId", v)
              validation.touch("assigneeId")
            }}
            options={users.map((u) => ({ value: u.id, label: u.name, sublabel: u.email }))}
            placeholder="Select a team member"
            searchPlaceholder="Search by name or email…"
            emptyText="No team members found."
            aria-invalid={!!validation.showError("assigneeId")}
          />
          {validation.showError("assigneeId") && (
            <p className="text-xs text-destructive">{validation.showError("assigneeId")}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="budget">Budget (USD)</Label>
          <Input
            id="budget"
            type="number"
            min="0"
            value={form.budget}
            onChange={(e) => update("budget", e.target.value)}
            onBlur={() => validation.touch("budget")}
            placeholder="25000"
            aria-invalid={!!validation.showError("budget")}
          />
          {validation.showError("budget") && (
            <p className="text-xs text-destructive">{validation.showError("budget")}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : project ? "Save changes" : "Create project"}
        </Button>
      </div>
    </form>
  )
}
