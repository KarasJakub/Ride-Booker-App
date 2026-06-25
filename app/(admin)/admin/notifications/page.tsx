"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Pencil, Trash2, Plus } from "lucide-react"
import api from "@/lib/apiClient"
import NotificationFormDialog from "@/components/admin/NotificationFormDialog"

type EventType =
  | "BOOKING_CREATED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_REJECTED"
  | "BOOKING_CANCELLED"
  | "ACCOUNT_CREATED"
  | "PASSWORD_RESET"
type RecipientType = "USER" | "BRANCH_ADMIN"

const EVENT_LABELS: Record<EventType, string> = {
  BOOKING_CREATED: "Rezerwacja utworzona",
  BOOKING_CONFIRMED: "Rezerwacja potwierdzona",
  BOOKING_REJECTED: "Rezerwacja odrzucona",
  BOOKING_CANCELLED: "Rezerwacja anulowana",
  ACCOUNT_CREATED: "Konto utworzone",
  PASSWORD_RESET: "Reset hasła",
}

const RECIPIENT_LABELS: Record<RecipientType, string> = {
  USER: "Użytkownik",
  BRANCH_ADMIN: "Branch Admin",
}

interface NotificationTemplate {
  id: string
  eventType: EventType
  recipient: RecipientType
  title: string
  bodyHtml: string
  isActive: boolean
  locationId?: string
  location?: { id: string; name: string }
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<NotificationTemplate | null>(
    null
  )
  const [deleteTarget, setDeleteTarget] = useState<NotificationTemplate | null>(
    null
  )

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: () => api.get("/notification-templates").then((r) => r.data),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/notification-templates/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] })
      toast.success("Status zaktualizowany")
    },
    onError: () => toast.error("Błąd podczas aktualizacji"),
  })

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => api.delete(`/notification-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] })
      toast.success("Szablon usunięty")
      setDeleteTarget(null)
    },
    onError: () => toast.error("Błąd podczas usuwania"),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Powiadomienia</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Zarządzaj szablonami maili wysyłanych automatycznie
          </p>
        </div>
        <Button
          onClick={() => {
            setEditTarget(null)
            setFormOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Dodaj powiadomienie
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Zdarzenie</TableHead>
            <TableHead>Odbiorca</TableHead>
            <TableHead>Tytuł</TableHead>
            <TableHead>Zakres</TableHead>
            <TableHead>Aktywny</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                Ładowanie...
              </TableCell>
            </TableRow>
          ) : templates.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                Brak szablonów powiadomień
              </TableCell>
            </TableRow>
          ) : (
            templates.map((template: NotificationTemplate) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">
                  {EVENT_LABELS[template.eventType]}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {RECIPIENT_LABELS[template.recipient]}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {template.title}
                </TableCell>
                <TableCell>
                  {template.location ? (
                    <Badge variant="outline">{template.location.name}</Badge>
                  ) : (
                    <Badge variant="outline">Globalny</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={template.isActive}
                    onCheckedChange={(checked) =>
                      toggleActive.mutate({
                        id: template.id,
                        isActive: !!checked,
                      })
                    }
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditTarget(template)
                        setFormOpen(true)
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(template)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <NotificationFormDialog
        key={editTarget?.id ?? "new"}
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditTarget(null)
        }}
        editTemplate={editTarget}
      />

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuń szablon powiadomienia</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Czy na pewno chcesz usunąć szablon{" "}
            <span className="font-medium text-foreground">
              {deleteTarget?.title}
            </span>
            ? Tej operacji nie można cofnąć.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTarget && deleteTemplate.mutate(deleteTarget.id)
              }
              disabled={deleteTemplate.isPending}
            >
              {deleteTemplate.isPending ? "Usuwanie..." : "Usuń"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
