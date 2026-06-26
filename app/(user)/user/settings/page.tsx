"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import api from "@/lib/apiClient"

export default function SettingsPage() {
  const router = useRouter()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get("/auth/me").then((r) => r.data),
  })

  const deleteAccount = useMutation({
    mutationFn: () => api.delete("/auth/account"),
    onSuccess: () => {
      clearAuth()
      toast.success("Konto zostało usunięte")
      router.push("/login")
    },
    onError: () => toast.error("Błąd podczas usuwania konta"),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Ładowanie...</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Moje konto</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Twoje dane osobowe i ustawienia konta
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs uppercase tracking-wide">
            Imię i nazwisko
          </Label>
          <Input
            value={user?.fullName ?? "—"}
            readOnly
            className="bg-muted/40"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs uppercase tracking-wide">
            Adres email
          </Label>
          <Input value={user?.email ?? "—"} readOnly className="bg-muted/40" />
        </div>

        {user?.phone && (
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Telefon
            </Label>
            <Input value={user.phone} readOnly className="bg-muted/40" />
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <h2 className="text-lg font-medium text-destructive">
          Strefa niebezpieczna
        </h2>
        <p className="text-sm text-muted-foreground">
          Usunięcie konta jest nieodwracalne. Wszystkie Twoje rezerwacje i dane
          zostaną trwale usunięte.
        </p>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
          Usuń konto
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuń konto</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Czy na pewno chcesz usunąć swoje konto? Tej operacji nie można
            cofnąć - wszystkie Twoje dane i rezerwacje zostaną trwale usunięte.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteAccount.mutate()}
              disabled={deleteAccount.isPending}
            >
              {deleteAccount.isPending ? "Usuwanie..." : "Tak, usuń konto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
