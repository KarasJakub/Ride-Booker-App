"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { CalendarCheck, LogOut, Bike } from "lucide-react"
import { toast } from "sonner"

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (useAuthStore.getState().user) return

    api
      .get("/auth/me")
      .then(({ data }) => {
        const currentToken = useAuthStore.getState().accessToken
        useAuthStore.getState().setAuth(data, currentToken!)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout")
    } catch {
      // ignore
    }
    useAuthStore.getState().clearAuth()
    toast.success("Wylogowano")
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/user/dashboard"
            className="flex items-center gap-2 font-medium"
          >
            <Bike
              className="w-5 h-5"
              style={{ color: "hsl(var(--brand-accent))" }}
              strokeWidth={2}
            />
            <span>Ride Booker</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link href="/user/dashboard">
              <Button
                variant={pathname === "/user/dashboard" ? "secondary" : "ghost"}
                size="sm"
              >
                Modele
              </Button>
            </Link>
            <Link href="/user/bookings">
              <Button
                variant={
                  pathname?.startsWith("/user/bookings") ? "secondary" : "ghost"
                }
                size="sm"
              >
                <CalendarCheck className="w-4 h-4 mr-2" />
                Moje rezerwacje
              </Button>
            </Link>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
