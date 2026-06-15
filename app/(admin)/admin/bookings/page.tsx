"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import api from "@/lib/apiClient"

const ALL_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
] as const
type BookingStatus = (typeof ALL_STATUSES)[number]

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
  user: { id: string; email: string; fullName: string; phone?: string }
  slot: {
    startTime: string
    endTime: string
    locationVehicle: {
      vehicle: { id: string; name: string }
    }
  }
}

export default function BookingsPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const locationId = user?.managedLocation?.id

  const [selectedStatuses, setSelectedStatuses] = useState<BookingStatus[]>([])
  const [vehicleFilter, setVehicleFilter] = useState<string>("all")
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false)

  const [rejectTarget, setRejectTarget] = useState<Booking | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

  const [detailsTarget, setDetailsTarget] = useState<Booking | null>(null)

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", locationId],
    queryFn: () =>
      api.get(`/bookings/location/${locationId}`).then((r) => r.data),
    enabled: !!locationId,
  })

  const updateStatus = useMutation({
    mutationFn: ({
      id,
      status,
      rejectionReason,
    }: {
      id: string
      status: string
      rejectionReason?: string
    }) => api.patch(`/bookings/${id}/status`, { status, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", locationId] })
      toast.success("Status rezerwacji zaktualizowany")
      setRejectTarget(null)
      setRejectionReason("")
    },
    onError: () => toast.error("Błąd podczas aktualizacji"),
  })

  const toggleStatus = (status: BookingStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    )
  }

  const vehicles = Array.from(
    new Map(
      bookings.map((b: Booking) => [
        b.slot.locationVehicle.vehicle.id,
        b.slot.locationVehicle.vehicle.name,
      ])
    ).entries()
  )

  const filteredBookings = bookings.filter((b: Booking) => {
    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(b.status)
    const matchesVehicle =
      vehicleFilter === "all" ||
      b.slot.locationVehicle.vehicle.id === vehicleFilter
    return matchesStatus && matchesVehicle
  })

  if (!locationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          Nie masz przypisanej lokalizacji.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Rezerwacje</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {user?.managedLocation?.name}
          </p>
        </div>
      </div>

      {/* Filtering */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Status multiselect */}
        <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-48 justify-between">
              {selectedStatuses.length === 0
                ? "Wszystkie statusy"
                : `${selectedStatuses.length} wybranych`}
              <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0">
            <Command>
              <CommandList>
                <CommandEmpty>Brak wyników</CommandEmpty>
                <CommandGroup>
                  {ALL_STATUSES.map((status) => (
                    <CommandItem
                      key={status}
                      onSelect={() => toggleStatus(status)}
                    >
                      <Check
                        className={`w-4 h-4 mr-2 ${
                          selectedStatuses.includes(status)
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      {STATUS_LABELS[status]}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Tags for choosen statuses */}
        {selectedStatuses.map((status) => (
          <Badge
            key={status}
            variant="secondary"
            className="cursor-pointer gap-1"
            onClick={() => toggleStatus(status)}
          >
            {STATUS_LABELS[status]}
            <X className="w-3 h-3" />
          </Badge>
        ))}

        {/* Vehicle filter */}
        <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Wszystkie pojazdy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie pojazdy</SelectItem>
            {vehicles.map(([id, name]) => (
              <SelectItem key={id as string} value={id as string}>
                {name as string}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Main Booking Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Klient</TableHead>
            <TableHead>Pojazd</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Godzina</TableHead>
            <TableHead>Status</TableHead>
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
          ) : filteredBookings.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                Brak rezerwacji
              </TableCell>
            </TableRow>
          ) : (
            filteredBookings.map((booking: Booking) => (
              <TableRow
                key={booking.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setDetailsTarget(booking)}
              >
                <TableCell>
                  <div className="font-medium">{booking.user.fullName}</div>
                  <div className="text-xs text-muted-foreground">
                    {booking.user.email}
                  </div>
                </TableCell>
                <TableCell>
                  {booking.slot.locationVehicle.vehicle.name}
                </TableCell>
                <TableCell>
                  {format(new Date(booking.slot.startTime), "dd.MM.yyyy", {
                    locale: pl,
                  })}
                </TableCell>
                <TableCell>
                  {format(new Date(booking.slot.startTime), "HH:mm")} –{" "}
                  {format(new Date(booking.slot.endTime), "HH:mm")}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[booking.status]}>
                    {STATUS_LABELS[booking.status]}
                  </Badge>
                </TableCell>
                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  {booking.status === "PENDING" && (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          updateStatus.mutate({
                            id: booking.id,
                            status: "CONFIRMED",
                          })
                        }
                        disabled={updateStatus.isPending}
                      >
                        Potwierdź
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRejectTarget(booking)}
                      >
                        Odrzuć
                      </Button>
                    </div>
                  )}
                  {booking.status === "CONFIRMED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateStatus.mutate({
                          id: booking.id,
                          status: "COMPLETED",
                        })
                      }
                      disabled={updateStatus.isPending}
                    >
                      Zakończ
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Rejection Dialog */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={() => {
          setRejectTarget(null)
          setRejectionReason("")
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Odrzuć rezerwację</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Rezerwacja:{" "}
              <span className="font-medium text-foreground">
                {rejectTarget?.slot.locationVehicle.vehicle.name}
              </span>{" "}
              — {rejectTarget?.user.fullName}
            </p>
            <div className="space-y-1">
              <Label>Powód odrzucenia (opcjonalny)</Label>
              <Textarea
                placeholder="Np. pojazd w serwisie, brak dostępności..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null)
                setRejectionReason("")
              }}
            >
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                rejectTarget &&
                updateStatus.mutate({
                  id: rejectTarget.id,
                  status: "REJECTED",
                  rejectionReason: rejectionReason || undefined,
                })
              }
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? "Odrzucanie..." : "Odrzuć"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={!!detailsTarget}
        onOpenChange={() => setDetailsTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Szczegóły rezerwacji</DialogTitle>
          </DialogHeader>
          {detailsTarget && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground">Klient</p>
                  <p className="font-medium">{detailsTarget.user.fullName}</p>
                  <p className="text-muted-foreground">
                    {detailsTarget.user.email}
                  </p>
                  {detailsTarget.user.phone && (
                    <p className="text-muted-foreground">
                      {detailsTarget.user.phone}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Pojazd</p>
                  <p className="font-medium">
                    {detailsTarget.slot.locationVehicle.vehicle.name}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data i godzina</p>
                  <p className="font-medium">
                    {format(
                      new Date(detailsTarget.slot.startTime),
                      "dd.MM.yyyy",
                      { locale: pl }
                    )}
                  </p>
                  <p>
                    {format(new Date(detailsTarget.slot.startTime), "HH:mm")} –{" "}
                    {format(new Date(detailsTarget.slot.endTime), "HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={STATUS_VARIANTS[detailsTarget.status]}>
                    {STATUS_LABELS[detailsTarget.status]}
                  </Badge>
                </div>
              </div>
              {detailsTarget.notes && (
                <div>
                  <p className="text-muted-foreground">Notatka klienta</p>
                  <p>{detailsTarget.notes}</p>
                </div>
              )}
              {detailsTarget.rejectionReason && (
                <div>
                  <p className="text-muted-foreground">Powód odrzucenia</p>
                  <p>{detailsTarget.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsTarget(null)}>
              Zamknij
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
