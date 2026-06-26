"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import LogoutButton from "@/components/shared/LogoutButton"
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Package,
  MapPin,
  Building2,
  Bike,
  Users,
  Mail,
} from "lucide-react"
import { ThemeToggle } from "@/components/shared/ThemeToggle"

type Role = "SUPER_ADMIN" | "ORG_ADMIN" | "BRANCH_ADMIN" | "USER"

const navItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["BRANCH_ADMIN", "ORG_ADMIN", "SUPER_ADMIN"] as Role[],
  },
  {
    label: "Rezerwacje",
    href: "/admin/bookings",
    icon: BookOpen,
    roles: ["BRANCH_ADMIN", "ORG_ADMIN", "SUPER_ADMIN"] as Role[],
  },
  {
    label: "Sloty",
    href: "/admin/slots",
    icon: CalendarDays,
    roles: ["BRANCH_ADMIN", "ORG_ADMIN", "SUPER_ADMIN"] as Role[],
  },
  {
    label: "Inwentarz",
    href: "/admin/inventory",
    icon: Package,
    roles: ["BRANCH_ADMIN", "ORG_ADMIN", "SUPER_ADMIN"] as Role[],
  },
  {
    label: "Lokalizacje",
    href: "/admin/locations",
    icon: MapPin,
    roles: ["ORG_ADMIN", "SUPER_ADMIN"] as Role[],
  },
  {
    label: "Organizacje",
    href: "/admin/organizations",
    icon: Building2,
    roles: ["SUPER_ADMIN"] as Role[],
  },
  {
    label: "Pojazdy",
    href: "/admin/vehicles",
    icon: Bike,
    roles: ["SUPER_ADMIN"] as Role[],
  },
  {
    label: "Użytkownicy",
    href: "/admin/users",
    icon: Users,
    roles: ["SUPER_ADMIN", "ORG_ADMIN"] as Role[],
  },
  {
    label: "Powiadomienia",
    href: "/admin/notifications",
    icon: Mail,
    roles: ["SUPER_ADMIN", "ORG_ADMIN", "BRANCH_ADMIN"] as Role[],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)

  const filteredItems = navItems.filter(
    (item) => user && item.roles.includes(user.role as Role)
  )

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="font-semibold text-lg">Ride Booker</div>
        {user && (
          <div className="text-sm text-muted-foreground">
            Cześć, {user.fullName}!
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Motyw</span>
          <ThemeToggle />
        </div>
        <LogoutButton />
      </SidebarFooter>
    </Sidebar>
  )
}
