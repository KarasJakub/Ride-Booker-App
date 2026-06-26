"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/apiClient"

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if (sessionStorage.getItem("restore_attempted")) return
    sessionStorage.setItem("restore_attempted", "true")

    const { accessToken, setAuth } = useAuthStore.getState()
    if (accessToken) return

    const restore = async () => {
      try {
        const { data } = await api.get("/auth/me")
        setAuth(data.user, data.accessToken)
      } catch {
        // redirect using middleware
      }
    }

    restore()
  }, [])

  return <>{children}</>
}
