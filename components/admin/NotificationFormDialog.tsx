"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import api from "@/lib/apiClient"

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

// per event type
const EVENT_VARIABLES: Record<EventType, string[]> = {
  BOOKING_CREATED: [
    "recipient_name",
    "customer_name",
    "vehicle_name",
    "location_name",
    "date",
  ],
  BOOKING_CONFIRMED: [
    "recipient_name",
    "customer_name",
    "vehicle_name",
    "location_name",
    "date",
  ],
  BOOKING_REJECTED: [
    "recipient_name",
    "customer_name",
    "vehicle_name",
    "location_name",
    "date",
    "rejection_reason",
  ],
  BOOKING_CANCELLED: [
    "recipient_name",
    "customer_name",
    "vehicle_name",
    "location_name",
    "date",
  ],
  ACCOUNT_CREATED: ["recipient_name"],
  PASSWORD_RESET: ["recipient_name"],
}

interface NotificationTemplate {
  id: string
  eventType: EventType
  recipient: RecipientType
  title: string
  bodyHtml: string
  isActive: boolean
  locationId?: string
}

interface Location {
  id: string
  name: string
}

interface Props {
  open: boolean
  onClose: () => void
  editTemplate?: NotificationTemplate | null
}

export default function NotificationFormDialog({
  open,
  onClose,
  editTemplate,
}: Props) {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const isEdit = !!editTemplate
  const isBranchAdmin = currentUser?.role === "BRANCH_ADMIN"

  const [eventType, setEventType] = useState<EventType>(
    editTemplate?.eventType ?? "BOOKING_CREATED"
  )
  const [recipient, setRecipient] = useState<RecipientType>(
    editTemplate?.recipient ?? "USER"
  )
  const [title, setTitle] = useState(editTemplate?.title ?? "")
  const [bodyHtml, setBodyHtml] = useState(editTemplate?.bodyHtml ?? "")
  const [locationId, setLocationId] = useState(
    editTemplate?.locationId ??
      (isBranchAdmin ? currentUser?.managedLocation?.id : "")
  )

  // Branch admins can only create templates for their own location, so we don't need to fetch locations for them
  const { data: locations = [] } = useQuery({
    queryKey: ["locations", currentUser?.organizationId],
    queryFn: () =>
      api
        .get("/locations", {
          params:
            currentUser?.role === "ORG_ADMIN"
              ? { organizationId: currentUser.organizationId }
              : {},
        })
        .then((r) => r.data),
    enabled: !isBranchAdmin,
  })

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        eventType,
        recipient,
        title,
        bodyHtml,
        locationId: locationId || undefined,
      }
      return isEdit
        ? api.patch(`/notification-templates/${editTemplate!.id}`, payload)
        : api.post("/notification-templates", payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] })
      toast.success(
        isEdit ? "Powiadomienie zaktualizowane" : "Powiadomienie dodane"
      )
      onClose()
    },
    onError: () => toast.error("Błąd podczas zapisywania"),
  })

  const insertVariable = (variable: string) => {
    setBodyHtml((prev) => prev + `{${variable}}`)
  }

  const availableVariables = EVENT_VARIABLES[eventType]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edytuj szablon" : "Dodaj szablon powiadomienia"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Typ zdarzenia</Label>
              <Select
                value={eventType}
                onValueChange={(v) => setEventType(v as EventType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Odbiorca</Label>
              <Select
                value={recipient}
                onValueChange={(v) => setRecipient(v as RecipientType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RECIPIENT_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isBranchAdmin && (
            <div className="space-y-1">
              <Label>Zakres</Label>
              <Select
                value={locationId || "global"}
                onValueChange={(v) => setLocationId(v === "global" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">
                    Globalny (dla całej platformy)
                  </SelectItem>
                  {locations.map((loc: Location) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label>Tytuł maila</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Np. Twoja rezerwacja została potwierdzona"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Treść maila</Label>
              <div className="flex gap-1 flex-wrap">
                {availableVariables.map((v) => (
                  <Badge
                    key={v}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/70"
                    onClick={() => insertVariable(v)}
                  >
                    {`{${v}}`}
                  </Badge>
                ))}
              </div>
            </div>
            <Textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              placeholder="Cześć {username}, Twoja rezerwacja na {vehicle_name}..."
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Kliknij znacznik powyżej aby wstawić go do treści. Można używać
              HTML do formatowania.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!title || !bodyHtml || mutation.isPending}
          >
            {mutation.isPending
              ? "Zapisywanie..."
              : isEdit
              ? "Zapisz zmiany"
              : "Dodaj"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
