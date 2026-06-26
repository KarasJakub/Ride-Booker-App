"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { CalendarCheck, LogOut, Bike, Heart, Menu, X, User } from "lucide-react"
import { toast } from "sonner"

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (useAuthStore.getState().user) return
    api
      .get("/auth/me")
      .then(({ data }) => {
        const currentToken = useAuthStore.getState().accessToken
        useAuthStore.getState().setAuth(data, currentToken!)
      })
      .catch(() => {
        router.push("/login")
      })
  }, [router])

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

  const navLinks = [
    { href: "/user/dashboard", label: "Modele", icon: Bike },
    { href: "/user/bookings", label: "Moje rezerwacje", icon: CalendarCheck },
    { href: "/user/favorites", label: "Ulubione", icon: Heart },
    { href: "/user/settings", label: "Ustawienia", icon: User },
  ]

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

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  variant={pathname?.startsWith(href) ? "secondary" : "ghost"}
                  size="sm"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </Button>
              </Link>
            ))}
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>

          {/* Mobile — only ThemeToggle and hamburger */}
          <div className="flex md:hidden items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Menu"
            >
              {menuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-sm px-6 py-3 space-y-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
                <Button
                  variant={pathname?.startsWith(href) ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </Button>
              </Link>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={() => {
                setMenuOpen(false)
                handleLogout()
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Wyloguj się
            </Button>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
