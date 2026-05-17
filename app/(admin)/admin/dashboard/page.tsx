"use client"

import { useAuthStore } from "@/store/authStore"
import LogoutButton from "@/components/shared/LogoutButton"

export default function AdminDashboardPage() {
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
      Cześć, {user.fullName}! <br /> <LogoutButton />{" "}
    </div>
  )
}
