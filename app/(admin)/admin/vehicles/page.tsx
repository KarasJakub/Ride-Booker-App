"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import api from "@/lib/apiClient"
import VehicleFormDialog from "@/components/admin/VehicleFormDialog"

interface VehicleType {
  id: string
  name: string
}

interface Vehicle {
  id: string
  name: string
  typeId: string
  engineCapacity: number
  power: number
  isActive: boolean
  type: VehicleType
  description: string
}

export default function VehiclesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [minPower, setMinPower] = useState("")
  const [maxCapacity, setMaxCapacity] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [deleteTypeTarget, setDeleteTypeTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false)
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)

  // Queries
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => api.get("/vehicles").then((r) => r.data),
  })

  const { data: types = [], isLoading: typesLoading } = useQuery({
    queryKey: ["vehicle-types"],
    queryFn: () => api.get("/vehicles/types").then((r) => r.data),
  })

  // Mutations
  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/vehicles/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      toast.success("Status pojazdu zaktualizowany")
    },
    onError: () => toast.error("Błąd podczas aktualizacji"),
  })

  const deleteVehicle = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      toast.success("Pojazd usunięty")
      setDeleteTarget(null)
    },
    onError: () => toast.error("Błąd podczas usuwania"),
  })

  const deleteType = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-types"] })
      toast.success("Typ usunięty")
      setDeleteTypeTarget(null)
    },
    onError: () => toast.error("Błąd podczas usuwania"),
  })

  // Filtering
  const filteredVehicles = vehicles.filter((v: Vehicle) => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === "all" || v.type?.id === typeFilter
    const matchesPower = minPower.trim() === "" || v.power <= Number(minPower)
    const matchesCapacity =
      maxCapacity.trim() === "" || v.engineCapacity <= Number(maxCapacity)

    return matchesSearch && matchesType && matchesPower && matchesCapacity
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Zarządzanie flotą</h1>
      </div>

      <Tabs defaultValue="vehicles">
        <TabsList>
          <TabsTrigger value="vehicles">Pojazdy</TabsTrigger>
          <TabsTrigger value="types">Typy pojazdów</TabsTrigger>
        </TabsList>

        {/* POJAZDY */}
        <TabsContent value="vehicles" className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Szukaj pojazdu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Typ pojazdu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie typy</SelectItem>
                {types.map((t: VehicleType) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Moc max (KM)"
              value={minPower}
              onChange={(e) => setMinPower(e.target.value)}
              className="w-36"
              type="number"
            />
            <Input
              placeholder="Pojemność max (cc)"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              className="w-38"
              type="number"
            />
            <Button
              className="ml-auto"
              onClick={() => {
                setEditVehicle(null)
                setVehicleFormOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Dodaj pojazd
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa</TableHead>
                <TableHead>Pojemność (cc)</TableHead>
                <TableHead>Moc (KM)</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Aktywny</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehiclesLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    Ładowanie...
                  </TableCell>
                </TableRow>
              ) : filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    Brak pojazdów
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles.map((vehicle: Vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">
                      {vehicle.name}
                    </TableCell>
                    <TableCell>{vehicle.engineCapacity}</TableCell>
                    <TableCell>{vehicle.power}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{vehicle.type?.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={vehicle.isActive}
                        onCheckedChange={(checked) =>
                          toggleActive.mutate({
                            id: vehicle.id,
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
                            setEditVehicle(vehicle)
                            setVehicleFormOpen(true)
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setDeleteTarget({
                              id: vehicle.id,
                              name: `${vehicle.name}`,
                            })
                          }
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
        </TabsContent>

        {/* TYPY */}
        <TabsContent value="types" className="space-y-4">
          <div className="flex justify-end">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Dodaj typ
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa typu</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typesLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="text-center text-muted-foreground"
                  >
                    Ładowanie...
                  </TableCell>
                </TableRow>
              ) : types.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="text-center text-muted-foreground"
                  >
                    Brak typów
                  </TableCell>
                </TableRow>
              ) : (
                types.map((type: VehicleType) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setDeleteTypeTarget({ id: type.id, name: type.name })
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
        </TabsContent>
      </Tabs>

      {/* Dialog usunięcia pojazdu */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuń pojazd</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Czy na pewno chcesz usunąć{" "}
            <span className="font-medium text-foreground">
              {deleteTarget?.name}
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
                deleteTarget && deleteVehicle.mutate(deleteTarget.id)
              }
              disabled={deleteVehicle.isPending}
            >
              {deleteVehicle.isPending ? "Usuwanie..." : "Usuń"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VehicleFormDialog
        open={vehicleFormOpen}
        onClose={() => {
          setVehicleFormOpen(false)
          setEditVehicle(null)
        }}
        types={types}
        editVehicle={editVehicle}
      />
      {/* Dialog usunięcia typu */}
      <Dialog
        open={!!deleteTypeTarget}
        onOpenChange={() => setDeleteTypeTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuń typ pojazdu</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Czy na pewno chcesz usunąć typ{" "}
            <span className="font-medium text-foreground">
              {deleteTypeTarget?.name}
            </span>
            ? Tej operacji nie można cofnąć.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTypeTarget(null)}>
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTypeTarget && deleteType.mutate(deleteTypeTarget.id)
              }
              disabled={deleteType.isPending}
            >
              {deleteType.isPending ? "Usuwanie..." : "Usuń"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
