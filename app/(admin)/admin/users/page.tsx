"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { MoreVertical } from "lucide-react"
import api from "@/lib/apiClient"
import CreateUserDialog from "@/components/admin/CreateUserDialog"
import { Plus } from "lucide-react"

interface OrgUser {
  id: string
  email: string
  fullName: string
  phone?: string
  role: "SUPER_ADMIN" | "ORG_ADMIN" | "BRANCH_ADMIN" | "USER"
  isActive: boolean
  organizationId?: string
  organization?: { id: string; name: string }
  managedLocation?: { id: string; name: string }
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

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ORG_ADMIN: "Org Admin",
  BRANCH_ADMIN: "Branch Admin",
  USER: "Użytkownik",
}

const ROLE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  SUPER_ADMIN: "default",
  ORG_ADMIN: "secondary",
  BRANCH_ADMIN: "secondary",
  USER: "outline",
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN"

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  const [assignOrgTarget, setAssignOrgTarget] = useState<OrgUser | null>(null)
  const [selectedOrgId, setSelectedOrgId] = useState("")

  const [assignBranchTarget, setAssignBranchTarget] = useState<OrgUser | null>(
    null
  )
  const [selectedLocationId, setSelectedLocationId] = useState("")

  const [createUserOpen, setCreateUserOpen] = useState(false)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", search, roleFilter],
    queryFn: () =>
      api
        .get("/auth/users", {
          params: {
            search: search || undefined,
            role: roleFilter !== "all" ? roleFilter : undefined,
          },
        })
        .then((r) => r.data),
  })

  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.get("/organizations").then((r) => r.data),
    enabled: isSuperAdmin,
  })

  const { data: locations = [] } = useQuery({
    queryKey: ["locations", currentUser?.organizationId],
    queryFn: () =>
      api
        .get("/locations", {
          params: !isSuperAdmin
            ? { organizationId: currentUser?.organizationId }
            : {},
        })
        .then((r) => r.data),
  })

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: ["users"] })

  const assignOrgAdmin = useMutation({
    mutationFn: ({ orgId, userId }: { orgId: string; userId: string }) =>
      api.post(`/organizations/${orgId}/assign-admin`, { userId }),
    onSuccess: () => {
      invalidateUsers()
      toast.success("Użytkownik przypisany jako Org Admin")
      setAssignOrgTarget(null)
      setSelectedOrgId("")
    },
    onError: () => toast.error("Błąd podczas przypisywania"),
  })

  const assignBranchAdmin = useMutation({
    mutationFn: ({
      locationId,
      userId,
    }: {
      locationId: string
      userId: string
    }) => api.post(`/locations/${locationId}/assign-admin`, { userId }),
    onSuccess: () => {
      invalidateUsers()
      toast.success("Użytkownik przypisany jako Branch Admin")
      setAssignBranchTarget(null)
      setSelectedLocationId("")
    },
    onError: () => toast.error("Błąd podczas przypisywania"),
  })

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/auth/users/${id}/role`, { role }),
    onSuccess: () => {
      invalidateUsers()
      toast.success("Rola zmieniona")
    },
    onError: () => toast.error("Błąd podczas zmiany roli"),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Użytkownicy</h1>
        <Button onClick={() => setCreateUserOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Utwórz użytkownika
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Szukaj po emailu lub imieniu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Wszystkie role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie role</SelectItem>
            {isSuperAdmin && (
              <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
            )}
            {isSuperAdmin && (
              <SelectItem value="ORG_ADMIN">Org Admin</SelectItem>
            )}
            <SelectItem value="BRANCH_ADMIN">Branch Admin</SelectItem>
            <SelectItem value="USER">Użytkownik</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Imię i nazwisko</TableHead>
            <TableHead>Rola</TableHead>
            <TableHead>Przypisanie</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                Ładowanie...
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                Brak użytkowników
              </TableCell>
            </TableRow>
          ) : (
            users.map((u: OrgUser) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.email}</TableCell>
                <TableCell>{u.fullName}</TableCell>
                <TableCell>
                  <Badge variant={ROLE_VARIANTS[u.role]}>
                    {ROLE_LABELS[u.role]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {u.managedLocation?.name || u.organization?.name || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isSuperAdmin && u.role === "USER" && (
                        <DropdownMenuItem onClick={() => setAssignOrgTarget(u)}>
                          Awansuj na Org Admin
                        </DropdownMenuItem>
                      )}
                      {u.role === "USER" && (
                        <DropdownMenuItem
                          onClick={() => setAssignBranchTarget(u)}
                        >
                          Awansuj na Branch Admin
                        </DropdownMenuItem>
                      )}
                      {(u.role === "ORG_ADMIN" ||
                        u.role === "BRANCH_ADMIN") && (
                        <DropdownMenuItem
                          onClick={() =>
                            changeRole.mutate({ id: u.id, role: "USER" })
                          }
                        >
                          Zdegraduj do Użytkownika
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Dialog: assign ORG Admin */}
      <Dialog
        open={!!assignOrgTarget}
        onOpenChange={() => {
          setAssignOrgTarget(null)
          setSelectedOrgId("")
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Przypisz jako Org Admin</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Wybierz organizację dla{" "}
            <span className="font-medium text-foreground">
              {assignOrgTarget?.fullName}
            </span>
          </p>
          <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOrgTarget(null)}>
              Anuluj
            </Button>
            <Button
              onClick={() =>
                assignOrgTarget &&
                assignOrgAdmin.mutate({
                  orgId: selectedOrgId,
                  userId: assignOrgTarget.id,
                })
              }
              disabled={!selectedOrgId || assignOrgAdmin.isPending}
            >
              {assignOrgAdmin.isPending ? "Przypisywanie..." : "Przypisz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: assign Branch Admin */}
      <Dialog
        open={!!assignBranchTarget}
        onOpenChange={() => {
          setAssignBranchTarget(null)
          setSelectedLocationId("")
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Przypisz jako Branch Admin</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Wybierz lokalizację dla{" "}
            <span className="font-medium text-foreground">
              {assignBranchTarget?.fullName}
            </span>
          </p>
          <Select
            value={selectedLocationId}
            onValueChange={setSelectedLocationId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wybierz lokalizację" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc: Location) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignBranchTarget(null)}
            >
              Anuluj
            </Button>
            <Button
              onClick={() =>
                assignBranchTarget &&
                assignBranchAdmin.mutate({
                  locationId: selectedLocationId,
                  userId: assignBranchTarget.id,
                })
              }
              disabled={!selectedLocationId || assignBranchAdmin.isPending}
            >
              {assignBranchAdmin.isPending ? "Przypisywanie..." : "Przypisz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CreateUserDialog
        open={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
      />
    </div>
  )
}
