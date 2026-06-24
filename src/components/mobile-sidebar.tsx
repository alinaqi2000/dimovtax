"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { Menu, X, FolderKanban, Users, BookOpen } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: typeof FolderKanban
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/users", label: "Users", icon: Users },
  { href: "/docs", label: "API Docs", icon: BookOpen, adminOnly: true },
]

export function MobileSidebar({ role }: { role?: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isAdmin = role === "admin"
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu />
      </Button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
              onClick={() => setOpen(false)}
            />
            <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-sidebar shadow-xl animate-in slide-in-from-left duration-200">
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
                <Link href="/projects" onClick={() => setOpen(false)} className="flex items-center">
                  <Image
                    src="/logo.webp"
                    alt="DimovTax"
                    width={120}
                    height={45}
                    className="h-7 w-auto dark:hidden"
                  />
                  <Image
                    src="/logo.webp"
                    alt="DimovTax"
                    width={120}
                    height={45}
                    className="hidden h-7 w-auto invert dark:block"
                  />
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                >
                  <X />
                </Button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </aside>
          </div>,
          document.body,
        )}
    </>
  )
}
