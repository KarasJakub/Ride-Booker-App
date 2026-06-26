"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import { Bike, Building2, MapPin, Users, CalendarCheck } from "lucide-react"
import api from "@/lib/apiClient"

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Oczekujące",
  CONFIRMED: "Potwierdzone",
  REJECTED: "Odrzucone",
  CANCELLED: "Anulowane",
  COMPLETED: "Zakończone",
}

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  CONFIRMED: "default",
  REJECTED: "destructive",
  CANCELLED: "secondary",
  COMPLETED: "secondary",
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

interface DashboardStats {
  bookingsByStatus: Record<string, number>
  popularModels: { name: string; count: number }[]
  bookingsOverTime: { date: string; count: number }[]
  activeVehiclesCount: number
  locationsCount: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentBookings: any[]
  globalCounts?: {
    organizationsCount: number
    locationsCount: number
    usersCount: number
  }
}

interface LocationComparison {
  locationId: string
  locationName: string
  city: string
  bookingsCount: number
  vehiclesCount: number
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  label: string
  value: number | string
}) {
  return (
    <div className="rounded-lg border border-border/60 p-4 space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const isBranchAdmin = user?.role === "BRANCH_ADMIN"
  const isSuperAdmin = user?.role === "SUPER_ADMIN"

  const [orgFilter, setOrgFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")

  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.get("/organizations").then((r) => r.data),
    enabled: isSuperAdmin,
  })

  const { data: locations = [] } = useQuery({
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

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats", orgFilter, locationFilter],
    queryFn: () =>
      api
        .get("/dashboard/stats", {
          params: {
            organizationId: orgFilter !== "all" ? orgFilter : undefined,
            locationId: locationFilter !== "all" ? locationFilter : undefined,
          },
        })
        .then((r) => r.data),
  })

  const { data: comparison = [] } = useQuery<LocationComparison[]>({
    queryKey: ["location-comparison", orgFilter],
    queryFn: () =>
      api
        .get("/dashboard/location-comparison", {
          params: {
            organizationId: orgFilter !== "all" ? orgFilter : undefined,
          },
        })
        .then((r) => r.data),
    enabled: !isBranchAdmin,
  })

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Ładowanie...</p>
      </div>
    )
  }

  const chartData = stats.bookingsOverTime.map((d) => ({
    ...d,
    label: format(new Date(d.date), "d MMM", { locale: pl }),
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isBranchAdmin ? user?.managedLocation?.name : "Przegląd systemu"}
          </p>
        </div>
      </div>

      {/* Filters - only SUPER_ADMIN / ORG_ADMIN */}
      {!isBranchAdmin && (
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
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Wszystkie lokalizacje" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie lokalizacje</SelectItem>
              {locations.map((loc: Location) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Global counts - only SUPER_ADMIN */}
      {stats.globalCounts && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Building2}
            label="Organizacje"
            value={stats.globalCounts.organizationsCount}
          />
          <StatCard
            icon={MapPin}
            label="Lokalizacje"
            value={stats.globalCounts.locationsCount}
          />
          <StatCard
            icon={Users}
            label="Użytkownicy"
            value={stats.globalCounts.usersCount}
          />
        </div>
      )}

      {/* Basic statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Bike}
          label="Aktywne pojazdy"
          value={stats.activeVehiclesCount}
        />
        <StatCard
          icon={MapPin}
          label="Lokalizacje"
          value={stats.locationsCount}
        />
        <StatCard
          icon={CalendarCheck}
          label="Oczekujące rezerwacje"
          value={stats.bookingsByStatus.PENDING}
        />
        <StatCard
          icon={CalendarCheck}
          label="Potwierdzone rezerwacje"
          value={stats.bookingsByStatus.CONFIRMED}
        />
      </div>

      {/* Bookings by status */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Rezerwacje wg statusu</h2>
        <div className="flex gap-3 flex-wrap">
          {Object.entries(stats.bookingsByStatus).map(([status, count]) => (
            <div
              key={status}
              className="flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2"
            >
              <Badge variant={STATUS_VARIANTS[status]}>
                {STATUS_LABELS[status]}
              </Badge>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bookings over time */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Rezerwacje — ostatnie 30 dni</h2>
        <div className="rounded-lg border border-border/60 p-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--brand-accent))"
                strokeWidth={2}
                dot={false}
                name="Rezerwacje"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Popular models */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Najpopularniejsze modele</h2>
        {stats.popularModels.length === 0 ? (
          <p className="text-muted-foreground text-sm">Brak danych</p>
        ) : (
          <div className="space-y-2">
            {stats.popularModels.map((model, i) => (
              <div key={model.name} className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm w-4">
                  {i + 1}.
                </span>
                <span className="flex-1 font-medium">{model.name}</span>
                <span className="text-muted-foreground text-sm">
                  {model.count} rezerwacji
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comparison of locations — SUPER_ADMIN / ORG_ADMIN */}
      {!isBranchAdmin && comparison.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Porównanie lokalizacji</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lokalizacja</TableHead>
                <TableHead>Miasto</TableHead>
                <TableHead>Rezerwacje</TableHead>
                <TableHead>Aktywne pojazdy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison.map((loc) => (
                <TableRow key={loc.locationId}>
                  <TableCell className="font-medium">
                    {loc.locationName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {loc.city}
                  </TableCell>
                  <TableCell>{loc.bookingsCount}</TableCell>
                  <TableCell>{loc.vehiclesCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Recent bookings */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Ostatnie rezerwacje</h2>
        {stats.recentBookings.length === 0 ? (
          <p className="text-muted-foreground text-sm">Brak rezerwacji</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Klient</TableHead>
                <TableHead>Pojazd</TableHead>
                {!isBranchAdmin && <TableHead>Lokalizacja</TableHead>}
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {stats.recentBookings.map((booking: any) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="font-medium">{booking.user.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {booking.user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {booking.slot.locationVehicle.vehicle.name}
                  </TableCell>
                  {!isBranchAdmin && (
                    <TableCell className="text-sm text-muted-foreground">
                      {booking.slot.locationVehicle.location.name}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[booking.status]}>
                      {STATUS_LABELS[booking.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
