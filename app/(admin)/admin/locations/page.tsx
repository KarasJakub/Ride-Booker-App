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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Pencil, Trash2, Plus } from "lucide-react"
import api from "@/lib/apiClient"

interface Location {
  id: string
  name: string
  city: string
  address?: string
  phone?: string
  lat?: number
  lng?: number
  isActive: boolean
  organizationId: string
  organization?: { id: string; name: string }
  branchAdmin?: { id: string; fullName: string } | null
}

interface Organization {
  id: string
  name: string
}

const emptyForm = {
  name: "",
  city: "",
  address: "",
  phone: "",
  lat: "",
  lng: "",
  isActive: true,
  organizationId: "",
}

export default function LocationsPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isSuperAdmin = user?.role === "SUPER_ADMIN"
  const isOrgAdmin = user?.role === "ORG_ADMIN"

  const [orgFilter, setOrgFilter] = useState<string>(
    isOrgAdmin ? user?.organizationId ?? "all" : "all"
  )
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Location | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null)
  const [form, setForm] = useState(emptyForm)

  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.get("/organizations").then((r) => r.data),
    enabled: isSuperAdmin,
  })

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["locations", orgFilter],
    queryFn: () =>
      api
        .get("/locations", {
          params: orgFilter !== "all" ? { organizationId: orgFilter } : {},
        })
        .then((r) => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        lat: form.lat ? Number(form.lat) : undefined,
        lng: form.lng ? Number(form.lng) : undefined,
        organizationId: form.organizationId || undefined,
      }
      return editTarget
        ? api.patch(`/locations/${editTarget.id}`, payload)
        : api.post("/locations", payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] })
      toast.success(
        editTarget ? "Lokalizacja zaktualizowana" : "Lokalizacja dodana"
      )
      setFormOpen(false)
    },
    onError: () => toast.error("Błąd podczas zapisywania"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] })
      toast.success("Lokalizacja usunięta")
      setDeleteTarget(null)
    },
    onError: () => toast.error("Błąd podczas usuwania"),
  })

  const openAdd = () => {
    setEditTarget(null)
    setForm({
      ...emptyForm,
      organizationId: isOrgAdmin ? user?.organizationId ?? "" : "",
    })
    setFormOpen(true)
  }

  const openEdit = (loc: Location) => {
    setEditTarget(loc)
    setForm({
      name: loc.name,
      city: loc.city,
      address: loc.address ?? "",
      phone: loc.phone ?? "",
      lat: loc.lat?.toString() ?? "",
      lng: loc.lng?.toString() ?? "",
      isActive: loc.isActive,
      organizationId: loc.organizationId,
    })
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Lokalizacje</h1>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj lokalizację
        </Button>
      </div>

      {/* Filtering by organization — only SUPER_ADMIN */}
      {isSuperAdmin && (
        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger className="w-64">
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nazwa</TableHead>
            <TableHead>Miasto</TableHead>
            <TableHead>Adres</TableHead>
            <TableHead>Telefon</TableHead>
            {isSuperAdmin && <TableHead>Organizacja</TableHead>}
            <TableHead>Branch Admin</TableHead>
            {/* <TableHead>Aktywna</TableHead> */}
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center text-muted-foreground"
              >
                Ładowanie...
              </TableCell>
            </TableRow>
          ) : locations.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center text-muted-foreground"
              >
                Brak lokalizacji
              </TableCell>
            </TableRow>
          ) : (
            locations.map((loc: Location) => (
              <TableRow key={loc.id}>
                <TableCell className="font-medium">{loc.name}</TableCell>
                <TableCell>{loc.city}</TableCell>
                <TableCell>{loc.address ?? "—"}</TableCell>
                <TableCell>{loc.phone ?? "—"}</TableCell>
                {isSuperAdmin && (
                  <TableCell>{loc.organization?.name ?? "—"}</TableCell>
                )}
                <TableCell>{loc.branchAdmin?.fullName ?? "—"}</TableCell>
                {/* <TableCell>
                  <Checkbox checked={loc.isActive} disabled />
                </TableCell> */}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(loc)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(loc)}
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

      {/* Dialog add/edit */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edytuj lokalizację" : "Dodaj lokalizację"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nazwa</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Miasto</Label>
              <Input
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Adres</Label>
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Telefon</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Szerokość geo. (lat)</Label>
                <Input
                  type="number"
                  value={form.lat}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lat: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Długość geo. (lng)</Label>
                <Input
                  type="number"
                  value={form.lng}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lng: e.target.value }))
                  }
                />
              </div>
            </div>
            {isSuperAdmin && !editTarget && (
              <div className="space-y-1">
                <Label>Organizacja</Label>
                <Select
                  value={form.organizationId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, organizationId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz organizację" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org: Organization) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* {editTarget && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, isActive: !!v }))
                  }
                />
                <Label htmlFor="isActive">Aktywna</Label>
              </div>
            )} */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!form.name || !form.city || saveMutation.isPending}
            >
              {saveMutation.isPending
                ? "Zapisywanie..."
                : editTarget
                ? "Zapisz zmiany"
                : "Dodaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog delete */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuń lokalizację</DialogTitle>
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
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Usuwanie..." : "Usuń"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
