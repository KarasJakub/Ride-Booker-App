"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/apiClient"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if (useAuthStore.getState().user) return

    api
      .get("/auth/me")
      .then(({ data }) => {
        const currentToken = useAuthStore.getState().accessToken
        useAuthStore.getState().setAuth(data, currentToken!)
      })
      .catch(() => {})
  }, [])

  return (
    <SidebarProvider>
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="flex items-center gap-2 p-4 border-b">
          <SidebarTrigger />
        </div>
        <div className="flex-1 p-6">{children}</div>
      </main>
    </SidebarProvider>
  )
}
