"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/apiClient"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { useRouter } from "next/navigation"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!isChecking) return

    api
      .get("/auth/me")
      .then(({ data }) => {
        const currentToken = useAuthStore.getState().accessToken
        useAuthStore.getState().setAuth(data, currentToken!)
        setIsChecking(false)
      })
      .catch(() => {
        router.push("/admin/login")
      })
  }, [router, isChecking])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin" />
      </div>
    )
  }

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
