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
import { Plus, Trash2 } from "lucide-react"
import api from "@/lib/apiClient"

interface VehicleType {
  id: string
  name: string
}

interface Vehicle {
  id: string
  name: string
  engineCapacity: number
  power: number
  isActive: boolean
  type: VehicleType
}

interface InventoryItem {
  id: string
  vehicleId: string
  locationId: string
  quantity: number
  isAvailable: boolean
  vehicle: Vehicle
}

export default function InventoryPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const locationId = user?.managedLocation?.id
  const organizationId = user?.managedLocation?.organizationId

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [addTarget, setAddTarget] = useState<Vehicle | null>(null)

  // Download inventory for user's location
  const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ["inventory", locationId],
    queryFn: () =>
      api.get(`/inventory/location/${locationId}`).then((r) => r.data),
    enabled: !!locationId,
  })

  // Fetch all vehicles in the organization
  const { data: allVehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ["vehicles", organizationId],
    queryFn: () =>
      api
        .get("/vehicles", { params: { organizationId, isActive: true } })
        .then((r) => r.data),
    enabled: !!organizationId,
  })

  // Vehicles that are in the inventory (by vehicleId)
  const inventoryVehicleIds = new Set(
    inventory.map((i: InventoryItem) => i.vehicleId)
  )

  // Vehicles available to add (not yet in inventory)
  const availableToAdd = allVehicles.filter(
    (v: Vehicle) => !inventoryVehicleIds.has(v.id)
  )

  // Add vehicle to inventory
  const addToInventory = useMutation({
    mutationFn: (vehicle: Vehicle) =>
      api.post("/inventory", {
        locationId,
        vehicleId: vehicle.id,
        quantity: 1,
        isAvailable: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", locationId] })
      toast.success("Pojazd dodany do inwentarza")
      setAddTarget(null)
    },
    onError: () => toast.error("Błąd podczas dodawania"),
  })

  // Toggle isAvailable
  const toggleAvailable = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      api.patch(`/inventory/${id}`, { isAvailable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", locationId] })
      toast.success("Status zaktualizowany")
    },
    onError: () => toast.error("Błąd podczas aktualizacji"),
  })

  // Remove from inventory
  const removeFromInventory = useMutation({
    mutationFn: (id: string) => api.delete(`/inventory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", locationId] })
      toast.success("Pojazd usunięty z inwentarza")
      setDeleteTarget(null)
    },
    onError: () => toast.error("Błąd podczas usuwania"),
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inwentarz</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {user?.managedLocation?.name}
          </p>
        </div>
      </div>

      {/* VEHICLES IN INVENTORY */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Pojazdy w moim oddziale</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Pojemność (cc)</TableHead>
              <TableHead>Moc (KM)</TableHead>
              <TableHead>Dostępny</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  Ładowanie...
                </TableCell>
              </TableRow>
            ) : inventory.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  Brak pojazdów w inwentarzu
                </TableCell>
              </TableRow>
            ) : (
              inventory.map((item: InventoryItem) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.vehicle.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.vehicle.type?.name}</Badge>
                  </TableCell>
                  <TableCell>{item.vehicle.engineCapacity}</TableCell>
                  <TableCell>{item.vehicle.power}</TableCell>
                  <TableCell>
                    <Checkbox
                      checked={item.isAvailable}
                      onCheckedChange={(checked) =>
                        toggleAvailable.mutate({
                          id: item.id,
                          isAvailable: !!checked,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setDeleteTarget({
                          id: item.id,
                          name: item.vehicle.name,
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* VEHICLES AVAILABLE TO ADD */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Dostępne do dodania</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Pojemność (cc)</TableHead>
              <TableHead>Moc (KM)</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehiclesLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  Ładowanie...
                </TableCell>
              </TableRow>
            ) : availableToAdd.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  Wszystkie pojazdy są już w inwentarzu
                </TableCell>
              </TableRow>
            ) : (
              availableToAdd.map((vehicle: Vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{vehicle.type?.name}</Badge>
                  </TableCell>
                  <TableCell>{vehicle.engineCapacity}</TableCell>
                  <TableCell>{vehicle.power}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setAddTarget(vehicle)}
                    >
                      <Plus className="w-4 h-4 text-green-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog for adding vehicles */}
      <Dialog open={!!addTarget} onOpenChange={() => setAddTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj pojazd do inwentarza</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Czy chcesz dodać{" "}
            <span className="font-medium text-foreground">
              {addTarget?.name}
            </span>{" "}
            do inwentarza swojego oddziału?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTarget(null)}>
              Anuluj
            </Button>
            <Button
              onClick={() => addTarget && addToInventory.mutate(addTarget)}
              disabled={addToInventory.isPending}
            >
              {addToInventory.isPending ? "Dodawanie..." : "Dodaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for removing vehicles */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuń z inwentarza</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Czy na pewno chcesz usunąć{" "}
            <span className="font-medium text-foreground">
              {deleteTarget?.name}
            </span>{" "}
            z inwentarza? Tej operacji nie można cofnąć.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTarget && removeFromInventory.mutate(deleteTarget.id)
              }
              disabled={removeFromInventory.isPending}
            >
              {removeFromInventory.isPending ? "Usuwanie..." : "Usuń"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
