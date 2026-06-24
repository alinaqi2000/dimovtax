"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginSchema } from "@/lib/schemas"
import { useFormValidation } from "@/lib/use-form-validation"

type LoginFormState = { email: string; password: string }

function LoginFormInner() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard"
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState<LoginFormState>({ email: "", password: "" })
  const validation = useFormValidation<LoginFormState>(loginSchema)

  function update<K extends keyof LoginFormState>(key: K, value: LoginFormState[K]) {
    const next = { ...form, [key]: value }
    setForm(next)
    validation.validate(next)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    validation.setSubmitAttempted(true)
    if (!validation.validate(form)) return

    setLoading(true)
    setError("")

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    if (res?.error) {
      setError("Invalid email or password")
      setLoading(false)
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          onBlur={() => validation.touch("email")}
          placeholder="you@example.com"
          aria-invalid={!!validation.showError("email")}
        />
        {validation.showError("email") && (
          <p className="text-xs text-destructive">{validation.showError("email")}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          onBlur={() => validation.touch("password")}
          placeholder="••••••••"
          aria-invalid={!!validation.showError("password")}
        />
        {validation.showError("password") && (
          <p className="text-xs text-destructive">{validation.showError("password")}</p>
        )}
      </div>
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            Sign in
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  )
}

export function LoginForm() {
  return (
    <Suspense fallback={null}>
      <LoginFormInner />
    </Suspense>
  )
}
