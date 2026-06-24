import { LogOut } from "lucide-react"
import { auth, signOut } from "@/auth"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { MobileSidebar } from "@/components/mobile-sidebar"

export async function Header({ role }: { role?: string }) {
  const session = await auth()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <MobileSidebar role={role} />
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session?.user && (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {session.user.name}
              </span>
              <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium sm:hidden">
                {session.user.name?.charAt(0).toUpperCase() ?? "?"}
              </span>
              <form
                action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/login" })
                }}
              >
                <Button type="submit" variant="ghost" size="icon-sm" aria-label="Sign out">
                  <LogOut />
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
