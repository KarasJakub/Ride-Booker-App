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

interface Organization {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
  organizationId: string
}

interface Slot {
  id: string
  startTime: string
  endTime: string
  isAvailable: boolean
  locationVehicleId: string
  locationVehicle?: {
    vehicle: { id: string; name: string; imageUrl?: string }
    location: {
      id: string
      name: string
      city: string
      organizationId?: string
    }
  }
}

export default function SlotsPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isBranchAdmin = user?.role === "BRANCH_ADMIN"
  const isSuperAdmin = user?.role === "SUPER_ADMIN"
  const locationId = user?.managedLocation?.id

  const [vehicleFilter, setVehicleFilter] = useState<string>("all")
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all")
  const [deleteTarget, setDeleteTarget] = useState<{ id: string } | null>(null)
  const [slotFormOpen, setSlotFormOpen] = useState(false)
  const [editSlot, setEditSlot] = useState<Slot | null>(null)
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(
    null
  )

  // Filters only for SUPER_ADMIN / ORG_ADMIN
  const [orgFilter, setOrgFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")

  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.get("/organizations").then((r) => r.data),
    enabled: isSuperAdmin,
  })

  const { data: adminLocations = [] } = useQuery({
    queryKey: ["locations", user?.organizationId, orgFilter],
    queryFn: () =>
      api
        .get("/locations", {
          params: isSuperAdmin
            ? orgFilter !== "all"
              ? { organizationId: orgFilter }
              : {}
            : { organizationId: user?.organizationId },
        })
        .then((r) => r.data),
    enabled: !isBranchAdmin,
  })

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory", locationId],
    queryFn: () =>
      api.get(`/inventory/location/${locationId}`).then((r) => r.data),
    enabled: !!locationId,
  })

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: isBranchAdmin
      ? ["slots", locationId]
      : ["slots-all", orgFilter, locationFilter],
    queryFn: () => {
      if (isBranchAdmin) {
        return api.get(`/slots/location/${locationId}`).then((r) => r.data)
      }
      return api
        .get("/slots", {
          params: {
            organizationId: orgFilter !== "all" ? orgFilter : undefined,
            locationId: locationFilter !== "all" ? locationFilter : undefined,
          },
        })
        .then((r) => r.data)
    },
    enabled: isBranchAdmin ? !!locationId : true,
  })

  const invalidateSlots = () => {
    queryClient.invalidateQueries({ queryKey: ["slots"] })
    queryClient.invalidateQueries({ queryKey: ["slots-all"] })
  }

  const deleteSlot = useMutation({
    mutationFn: (id: string) => api.delete(`/slots/${id}`),
    onSuccess: () => {
      invalidateSlots()
      toast.success("Slot usunięty")
      setDeleteTarget(null)
    },
    onError: () => toast.error("Błąd podczas usuwania"),
  })

  const toggleAvailable = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      api.patch(`/slots/${id}`, { isAvailable }),
    onSuccess: () => {
      invalidateSlots()
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

  const getVehicleName = (slot: Slot) => {
    if (slot.locationVehicle?.vehicle) return slot.locationVehicle.vehicle.name
    const item = inventory.find(
      (i: InventoryItem) => i.id === slot.locationVehicleId
    )
    return item?.vehicle?.name ?? "—"
  }

  if (isBranchAdmin && !locationId) {
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
            {isBranchAdmin ? user?.managedLocation?.name : "Wszystkie sloty"}
          </p>
        </div>
        {isBranchAdmin && (
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
        )}
      </div>

      {/* Filtreing */}
      <div className="flex items-center gap-4 flex-wrap">
        {isSuperAdmin && (
          <Select
            value={orgFilter}
            onValueChange={(v) => {
              setOrgFilter(v)
              setLocationFilter("all")
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Wszystkie organizacje" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie organizacje</SelectItem>
              {organizations.map((org: Organization) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {!isBranchAdmin && (
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Wszystkie lokalizacje" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie lokalizacje</SelectItem>
              {adminLocations.map((loc: Location) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {isBranchAdmin && (
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
        )}

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
            {!isBranchAdmin && <TableHead>Lokalizacja</TableHead>}
            <TableHead>Data</TableHead>
            <TableHead>Od</TableHead>
            <TableHead>Do</TableHead>
            <TableHead>Dostępny</TableHead>
            {isBranchAdmin && (
              <TableHead className="text-right">Akcje</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {slotsLoading ? (
            <TableRow>
              <TableCell
                colSpan={isBranchAdmin ? 6 : 6}
                className="text-center text-muted-foreground"
              >
                Ładowanie...
              </TableCell>
            </TableRow>
          ) : filteredSlots.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={isBranchAdmin ? 6 : 6}
                className="text-center text-muted-foreground"
              >
                Brak slotów
              </TableCell>
            </TableRow>
          ) : (
            filteredSlots.map((slot: Slot) => (
              <TableRow key={slot.id}>
                <TableCell className="font-medium">
                  {getVehicleName(slot)}
                </TableCell>
                {!isBranchAdmin && (
                  <TableCell className="text-sm text-muted-foreground">
                    {slot.locationVehicle?.location?.name ?? "—"}
                  </TableCell>
                )}
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
                  {isBranchAdmin ? (
                    <Checkbox
                      checked={slot.isAvailable}
                      onCheckedChange={(checked) =>
                        toggleAvailable.mutate({
                          id: slot.id,
                          isAvailable: !!checked,
                        })
                      }
                    />
                  ) : (
                    <Badge variant={slot.isAvailable ? "default" : "secondary"}>
                      {slot.isAvailable ? "Tak" : "Nie"}
                    </Badge>
                  )}
                </TableCell>
                {isBranchAdmin && (
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
                )}
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

      {isBranchAdmin && (
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
          locationId={locationId!}
        />
      )}
    </div>
  )
}
