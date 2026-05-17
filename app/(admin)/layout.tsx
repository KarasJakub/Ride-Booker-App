"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/apiClient"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, setAuth } = useAuthStore()

  useEffect(() => {
    if (user) return

    api
      .get("/auth/me")
      .then(({ data }) => {
        const currentToken = useAuthStore.getState().accessToken
        setAuth(data, currentToken!)
      })
      .catch(() => {})
  }, [setAuth, user])

  console.log("AdminLayout render, user:", user)

  return <div>{children}</div>
}
