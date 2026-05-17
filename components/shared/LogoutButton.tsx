"use client"

import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/apiClient"
import { Button } from "@/components/ui/button"

export default function LogoutButton() {
  const router = useRouter()
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout")
    } finally {
      clearAuth()
      router.push("/login")
    }
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      Wyloguj się
    </Button>
  )
}
