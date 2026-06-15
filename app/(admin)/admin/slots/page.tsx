"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Pencil, Trash2, Plus } from "lucide-react"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import api from "@/lib/apiClient"
import SlotFormDialog from "@/components/admin/SlotFormDialog"

interface InventoryItem {
  id: string
  vehicleId: string
  isAvailable: boolean
  vehicle: {
    id: string
    name: string
    type: { name: string }
  }
}

interface Slot {
  id: string
  startTime: string
  endTime: string
  isAvailable: boolean
  locationVehicleId: string
}

export default function SlotsPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const locationId = user?.managedLocation?.id

  const [vehicleFilter, setVehicleFilter] = useState<string>("all")
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all")
  const [deleteTarget, setDeleteTarget] = useState<{ id: string } | null>(null)
  const [slotFormOpen, setSlotFormOpen] = useState(false)
  const [editSlot, setEditSlot] = useState<Slot | null>(null)
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(
    null
  )

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory", locationId],
    queryFn: () =>
      api.get(`/inventory/location/${locationId}`).then((r) => r.data),
    enabled: !!locationId,
  })

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["slots", locationId],
    queryFn: () => api.get(`/slots/location/${locationId}`).then((r) => r.data),
    enabled: !!locationId,
  })

  const deleteSlot = useMutation({
    mutationFn: (id: string) => api.delete(`/slots/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots", locationId] })
      toast.success("Slot usunięty")
      setDeleteTarget(null)
    },
    onError: () => toast.error("Błąd podczas usuwania"),
  })

  const toggleAvailable = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      api.patch(`/slots/${id}`, { isAvailable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots", locationId] })
      toast.success("Status zaktualizowany")
    },
    onError: () => toast.error("Błąd podczas aktualizacji"),
  })

  const filteredSlots = slots.filter((slot: Slot) => {
    const matchesVehicle =
      vehicleFilter === "all" || slot.locationVehicleId === vehicleFilter
    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" && slot.isAvailable) ||
      (availabilityFilter === "unavailable" && !slot.isAvailable)
    return matchesVehicle && matchesAvailability
  })

  const getVehicleName = (locationVehicleId: string) => {
    const item = inventory.find(
      (i: InventoryItem) => i.id === locationVehicleId
    )
    return item?.vehicle?.name ?? "—"
  }

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
          <h1 className="text-2xl font-semibold">Sloty</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {user?.managedLocation?.name}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditSlot(null)
            setSelectedInventoryId(null)
            setSlotFormOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Dodaj slot
        </Button>
      </div>

      {/* Filtreing */}
      <div className="flex items-center gap-4">
        <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Wszystkie pojazdy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie pojazdy</SelectItem>
            {inventory.map((item: InventoryItem) => (
              <SelectItem key={item.id} value={item.id}>
                {item.vehicle.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={availabilityFilter}
          onValueChange={setAvailabilityFilter}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Dostępność" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="available">Dostępne</SelectItem>
            <SelectItem value="unavailable">Niedostępne</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pojazd</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Od</TableHead>
            <TableHead>Do</TableHead>
            <TableHead>Dostępny</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {slotsLoading ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                Ładowanie...
              </TableCell>
            </TableRow>
          ) : filteredSlots.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                Brak slotów
              </TableCell>
            </TableRow>
          ) : (
            filteredSlots.map((slot: Slot) => (
              <TableRow key={slot.id}>
                <TableCell className="font-medium">
                  {getVehicleName(slot.locationVehicleId)}
                </TableCell>
                <TableCell>
                  {format(new Date(slot.startTime), "dd.MM.yyyy", {
                    locale: pl,
                  })}
                </TableCell>
                <TableCell>
                  {format(new Date(slot.startTime), "HH:mm")}
                </TableCell>
                <TableCell>{format(new Date(slot.endTime), "HH:mm")}</TableCell>
                <TableCell>
                  <Checkbox
                    checked={slot.isAvailable}
                    onCheckedChange={(checked) =>
                      toggleAvailable.mutate({
                        id: slot.id,
                        isAvailable: !!checked,
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
                        setEditSlot(slot)
                        setSelectedInventoryId(slot.locationVehicleId)
                        setSlotFormOpen(true)
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget({ id: slot.id })}
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

      {/* Dialog for deleting slot */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuń slot</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Czy na pewno chcesz usunąć ten slot? Tej operacji nie można cofnąć.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteSlot.mutate(deleteTarget.id)}
              disabled={deleteSlot.isPending}
            >
              {deleteSlot.isPending ? "Usuwanie..." : "Usuń"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SlotFormDialog
        key={editSlot?.id ?? "new"}
        open={slotFormOpen}
        onClose={() => {
          setSlotFormOpen(false)
          setEditSlot(null)
          setSelectedInventoryId(null)
        }}
        inventory={inventory}
        editSlot={editSlot}
        defaultInventoryId={selectedInventoryId}
        locationId={locationId}
      />
    </div>
  )
}
