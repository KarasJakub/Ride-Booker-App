"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Bike, MapPin, ArrowLeft, Clock } from "lucide-react"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import api from "@/lib/apiClient"
import Link from "next/link"
import { Heart } from "lucide-react"
import { useFavorites } from "@/hooks/use-favorites"
import Image from "next/image"

interface Location {
  id: string
  name: string
  city: string
  address?: string
  isActive: boolean
}

interface InventoryItem {
  id: string
  isAvailable: boolean
  location: Location
}

interface VehicleDetail {
  id: string
  name: string
  engineCapacity: number
  power: number
  description?: string
  imageUrl?: string
  type: { id: string; name: string }
  inventory: InventoryItem[]
}

interface Slot {
  id: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

export default function VehicleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const vehicleId = params.id as string

  const [selectedLocationVehicleId, setSelectedLocationVehicleId] = useState<
    string | null
  >(null)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const { favoriteIds, toggleFavorite } = useFavorites()

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle-detail", vehicleId],
    queryFn: () => api.get(`/vehicles/${vehicleId}`).then((r) => r.data),
  })

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["slots-for-inventory", selectedLocationVehicleId],
    queryFn: () =>
      api
        .get(`/slots/inventory/${selectedLocationVehicleId}`)
        .then((r) => r.data),
    enabled: !!selectedLocationVehicleId,
  })

  const createBooking = useMutation({
    mutationFn: () =>
      api.post("/bookings", {
        slotId: selectedSlotId,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast.success("Rezerwacja złożona — czeka na potwierdzenie salonu")
      router.push("/user/bookings")
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ?? "Błąd podczas składania rezerwacji"
      toast.error(message)
    },
  })

  const availableSlots = slots.filter((s: Slot) => s.isAvailable)

  const { data: myBookings = [] } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => api.get("/bookings/me").then((r) => r.data),
  })

  const hasConflict = (slotId: string) => {
    const slot = availableSlots.find((s: Slot) => s.id === slotId)
    if (!slot) return false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return myBookings.some((booking: any) => {
      if (!["PENDING", "CONFIRMED"].includes(booking.status)) return false
      const bookingStart = new Date(booking.slot.startTime)
      const bookingEnd = new Date(booking.slot.endTime)
      const slotStart = new Date(slot.startTime)
      const slotEnd = new Date(slot.endTime)
      return slotStart < bookingEnd && slotEnd > bookingStart
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Model nie został znaleziony
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <Link
        href="/user/dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Wróć do listy modeli
      </Link>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        <div className="relative h-64 bg-muted flex items-center justify-center">
          {vehicle.imageUrl ? (
            <Image
              src={vehicle.imageUrl}
              alt={vehicle.name}
              fill
              className="w-full h-full object-cover"
            />
          ) : (
            <Bike
              className="w-16 h-16 text-muted-foreground/40"
              strokeWidth={1.5}
            />
          )}
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold">{vehicle.name}</h1>
            <Badge variant="secondary">{vehicle.type?.name}</Badge>
            <button
              onClick={() => toggleFavorite(vehicle.id)}
              className="w-9 h-9 rounded-full border border-border/60 flex items-center justify-center hover:border-border transition-colors"
            >
              <Heart
                className="w-4 h-4"
                fill={
                  favoriteIds.has(vehicle.id)
                    ? "hsl(var(--brand-accent))"
                    : "none"
                }
                style={{
                  color: favoriteIds.has(vehicle.id)
                    ? "hsl(var(--brand-accent))"
                    : undefined,
                }}
              />
            </button>
          </div>
          <p className="text-muted-foreground">
            {vehicle.engineCapacity} cc · {vehicle.power} KM
          </p>
          {vehicle.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {vehicle.description}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Wybierz salon</h2>

        {vehicle.inventory.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Ten model nie jest aktualnie dostępny w żadnym salonie.
          </p>
        ) : (
          <div className="grid gap-3">
            {vehicle.inventory.map((item: InventoryItem) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedLocationVehicleId(item.id)
                  setSelectedSlotId(null)
                }}
                className={`text-left p-4 rounded-lg border transition-colors ${
                  selectedLocationVehicleId === item.id
                    ? "border-2"
                    : "border-border/60 hover:border-border"
                }`}
                style={
                  selectedLocationVehicleId === item.id
                    ? { borderColor: "hsl(var(--brand-accent))" }
                    : undefined
                }
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium">{item.location.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.location.city}
                      {item.location.address
                        ? `, ${item.location.address}`
                        : ""}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedLocationVehicleId && (
        <>
          <Separator />
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Wybierz termin</h2>

            {slotsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Brak dostępnych terminów w tym salonie. Wybierz inny salon.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableSlots.map((slot: Slot) => {
                  const conflict = hasConflict(slot.id)
                  const isSelected = selectedSlotId === slot.id

                  return (
                    <button
                      key={slot.id}
                      onClick={() => !conflict && setSelectedSlotId(slot.id)}
                      disabled={conflict}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        conflict
                          ? "border-border/40 opacity-50 cursor-not-allowed bg-muted/30"
                          : isSelected
                          ? "border-2"
                          : "border-border/60 hover:border-border"
                      }`}
                      style={
                        isSelected && !conflict
                          ? { borderColor: "hsl(var(--brand-accent))" }
                          : undefined
                      }
                    >
                      <p className="text-sm font-medium">
                        {format(new Date(slot.startTime), "d MMMM", {
                          locale: pl,
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {format(new Date(slot.startTime), "HH:mm")}–
                        {format(new Date(slot.endTime), "HH:mm")}
                      </p>
                      {conflict && (
                        <p className="text-xs text-destructive mt-1">
                          Masz już rezerwację
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {selectedSlotId && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Wiadomość do salonu (opcjonalna)</Label>
              <Textarea
                placeholder="Np. chciałbym przetestować model na autostradzie..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              size="lg"
              style={{ backgroundColor: "hsl(var(--brand-accent))" }}
              onClick={() => createBooking.mutate()}
              disabled={createBooking.isPending}
            >
              {createBooking.isPending
                ? "Wysyłanie..."
                : "Zarezerwuj jazdę próbną"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
