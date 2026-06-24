"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  if (typeof window !== "undefined" && !mounted) {
    queueMicrotask(() => setMounted(true))
  }

  if (!mounted) {
    return <Button variant="ghost" size="icon-sm" />
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
