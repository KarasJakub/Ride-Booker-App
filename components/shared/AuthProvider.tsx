"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/apiClient"

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { setAuth, clearAuth, accessToken } = useAuthStore()

  useEffect(() => {
    if (accessToken) return

    const restore = async () => {
      try {
        const { data } = await api.get("/auth/me")
        setAuth(data.user, data.accessToken)
      } catch {
        clearAuth()
      }
    }

    restore()
    // forcing to refresh session on page load to get new access token if refresh token is still valid (only once)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
