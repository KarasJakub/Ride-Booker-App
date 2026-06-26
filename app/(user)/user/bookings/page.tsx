"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Bike, MapPin, Calendar, Clock } from "lucide-react"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import api from "@/lib/apiClient"
import Image from "next/image"

type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED"

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Oczekująca",
  CONFIRMED: "Potwierdzona",
  REJECTED: "Odrzucona",
  CANCELLED: "Anulowana",
  COMPLETED: "Zakończona",
}

const STATUS_VARIANTS: Record<
  BookingStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  CONFIRMED: "default",
  REJECTED: "destructive",
  CANCELLED: "secondary",
  COMPLETED: "secondary",
}

interface Booking {
  id: string
  status: BookingStatus
  notes?: string
  rejectionReason?: string
  createdAt: string
  slot: {
    startTime: string
    endTime: string
    locationVehicle: {
      vehicle: { id: string; name: string; imageUrl?: string }
      location: {
        id: string
        name: string
        city: string
        address?: string
        phone?: string
      }
    }
  }
}

export default function MyBookingsPage() {
  const queryClient = useQueryClient()
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => api.get("/bookings/me").then((r) => r.data),
  })

  const cancelBooking = useMutation({
    mutationFn: (id: string) => api.patch(`/bookings/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] })
      toast.success("Rezerwacja anulowana")
      setCancelTarget(null)
    },
    onError: () => toast.error("Błąd podczas anulowania rezerwacji"),
  })

  const canCancel = (status: BookingStatus) =>
    status === "PENDING" || status === "CONFIRMED"

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Moje rezerwacje</h1>
        <p className="text-muted-foreground text-sm">
          Status Twoich zaplanowanych jazd próbnych
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          Nie masz jeszcze żadnych rezerwacji
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking: Booking) => {
            const vehicle = booking.slot.locationVehicle.vehicle
            const location = booking.slot.locationVehicle.location

            return (
              <div
                key={booking.id}
                className="rounded-lg border border-border/60 p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="relative w-16 h-16 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {vehicle.imageUrl ? (
                        <Image
                          src={vehicle.imageUrl}
                          alt={vehicle.name}
                          fill
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Bike
                          className="w-6 h-6 text-muted-foreground/40"
                          strokeWidth={1.5}
                        />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">{vehicle.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {location.name}, {location.city}
                      </p>
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANTS[booking.status]}>
                    {STATUS_LABELS[booking.status]}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(booking.slot.startTime), "d MMMM yyyy", {
                      locale: pl,
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(booking.slot.startTime), "HH:mm")}–
                    {format(new Date(booking.slot.endTime), "HH:mm")}
                  </span>
                </div>

                {booking.notes && (
                  <p className="text-sm text-muted-foreground border-l-2 border-border pl-3">
                    {booking.notes}
                  </p>
                )}

                {booking.status === "REJECTED" && booking.rejectionReason && (
                  <p className="text-sm text-destructive border-l-2 border-destructive/40 pl-3">
                    Powód odrzucenia: {booking.rejectionReason}
                  </p>
                )}

                {canCancel(booking.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelTarget(booking)}
                  >
                    Anuluj rezerwację
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Canceling reservation dialog  */}
      <Dialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anuluj rezerwację</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Czy na pewno chcesz anulować rezerwację{" "}
            <span className="font-medium text-foreground">
              {cancelTarget?.slot.locationVehicle.vehicle.name}
            </span>{" "}
            na{" "}
            {cancelTarget &&
              format(
                new Date(cancelTarget.slot.startTime),
                "d MMMM yyyy, HH:mm",
                { locale: pl }
              )}
            ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Wróć
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                cancelTarget && cancelBooking.mutate(cancelTarget.id)
              }
              disabled={cancelBooking.isPending}
            >
              {cancelBooking.isPending ? "Anulowanie..." : "Anuluj rezerwację"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
