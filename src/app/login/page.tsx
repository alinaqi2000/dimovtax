import type { Metadata } from "next"
import Image from "next/image"
import { LoginForm } from "@/components/login-form"
import { ThemeToggle } from "@/components/theme-toggle"

export const metadata: Metadata = {
  title: "Sign in — DimovTax",
}

export default function LoginPage() {
  return (
    <div className="dark relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] px-4 text-white">
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-20 size-96 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-32 -right-10 size-80 rounded-full bg-white/5 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute left-1/3 top-1/2 size-64 rounded-full bg-white/5 blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Theme toggle — top right */}
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      {/* Centered login box */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
          <Image
            src="/logo.webp"
            alt="DimovTax"
            width={180}
            height={68}
            priority
            className="h-10 w-auto invert"
          />
          <p className="text-sm text-white/50">
            Sign in to your dashboard
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <LoginForm />
        </div>

        <div className="mt-5 rounded-lg border border-dashed border-white/15 p-3">
          <p className="text-center text-xs text-white/40">
            <span className="font-medium text-white/60">Demo:</span>{" "}
            admin@dimovtax.com / admin123
          </p>
        </div>
      </div>
    </div>
  )
}
