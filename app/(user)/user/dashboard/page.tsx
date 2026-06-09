"use client"

import LogoutButton from "@/components/shared/LogoutButton"
import { useAuthStore } from "@/store/authStore"

export default function UserDashboardPage() {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return (
      <>
        <div>Ładowanie...</div>
      </>
    )
  }

  return (
    <div>
      PANEL UŻYTKOWNIKA <br />
      Cześć, {user.fullName}! <br />
      Rola: {user.role} <br />
      <LogoutButton />
    </div>
  )
}
