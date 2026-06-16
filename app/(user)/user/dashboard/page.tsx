"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Bike, ArrowRight } from "lucide-react"
import api from "@/lib/apiClient"
import Image from "next/image"

interface VehicleType {
  id: string
  name: string
}

interface Vehicle {
  id: string
  name: string
  engineCapacity: number
  power: number
  description?: string
  imageUrl?: string
  isActive: boolean
  type: VehicleType
  _count?: { inventory: number }
}

export default function UserDashboardPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["public-vehicles"],
    queryFn: () =>
      api.get("/vehicles", { params: { isActive: true } }).then((r) => r.data),
  })

  const { data: types = [] } = useQuery({
    queryKey: ["vehicle-types"],
    queryFn: () => api.get("/vehicles/types").then((r) => r.data),
  })

  const availableVehicles = vehicles.filter(
    (v: Vehicle) => (v._count?.inventory ?? 0) > 0
  )

  const filteredVehicles = availableVehicles.filter((v: Vehicle) => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === "all" || v.type?.id === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Modele motocykli</h1>
        <p className="text-muted-foreground text-sm">
          Wybierz motocykl i zarezerwuj jazdę próbną w najbliższym salonie
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Szukaj modelu..."
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
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-44 w-full rounded-lg" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          Brak dostępnych modeli spełniających kryteria
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle: Vehicle) => (
            <Link
              key={vehicle.id}
              href={`/user/vehicles/${vehicle.id}`}
              className="group rounded-lg border border-border/60 overflow-hidden hover:border-border transition-colors"
            >
              <div className="relative h-44 bg-muted flex items-center justify-center overflow-hidden">
                {vehicle.imageUrl ? (
                  <Image
                    src={vehicle.imageUrl}
                    alt={vehicle.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <Bike
                    className="w-12 h-12 text-muted-foreground/40"
                    strokeWidth={1.5}
                  />
                )}
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium leading-tight">{vehicle.name}</h3>
                  <Badge variant="secondary" className="shrink-0">
                    {vehicle.type?.name}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  {vehicle.engineCapacity} cc · {vehicle.power} KM
                </p>

                <div
                  className="flex items-center text-sm font-medium pt-1"
                  style={{ color: "hsl(var(--brand-accent))" }}
                >
                  Zobacz szczegóły
                  <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
