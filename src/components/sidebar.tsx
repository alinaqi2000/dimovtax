"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FolderKanban, Users, BookOpen } from "lucide-react"
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

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname()
  const isAdmin = role === "admin"
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-sidebar md:flex md:flex-col">
      <div className="flex h-16 justify-center items-center border-b px-5">
        <Link href="/projects" className="flex items-center">
          <Image
            src="/logo.webp"
            alt="DimovTax"
            width={120}
            height={45}
            priority
            className="h-7 w-auto dark:hidden"
          />
          <Image
            src="/logo.webp"
            alt="DimovTax"
            width={120}
            height={45}
            priority
            className="hidden h-7 w-auto invert dark:block"
          />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
  )
}
