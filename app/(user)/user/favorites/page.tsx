"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Bike, Heart, ArrowRight } from "lucide-react"
import { useFavorites } from "@/hooks/use-favorites"
import Image from "next/image"

export default function FavoritesPage() {
  const { favorites, isLoading, toggleFavorite } = useFavorites()

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Ulubione</h1>
        <p className="text-muted-foreground text-sm">
          Modele które zapisałeś do późniejszego porównania
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-lg" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          Nie masz jeszcze żadnych ulubionych modeli
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {favorites.map((fav: any) => (
            <Link
              key={fav.id}
              href={`/user/vehicles/${fav.vehicle.id}`}
              className="group rounded-lg border border-border/60 overflow-hidden hover:border-border transition-colors"
            >
              <div className="relative h-44 bg-muted flex items-center justify-center overflow-hidden">
                {fav.vehicle.imageUrl ? (
                  <Image
                    src={fav.vehicle.imageUrl}
                    alt={fav.vehicle.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <Bike
                    className="w-12 h-12 text-muted-foreground/40"
                    strokeWidth={1.5}
                  />
                )}

                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleFavorite(fav.vehicle.id)
                  }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                >
                  <Heart
                    className="w-4 h-4"
                    fill="hsl(var(--brand-accent))"
                    style={{ color: "hsl(var(--brand-accent))" }}
                  />
                </button>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium leading-tight">
                    {fav.vehicle.name}
                  </h3>
                  <Badge variant="secondary" className="shrink-0">
                    {fav.vehicle.type?.name}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  {fav.vehicle.engineCapacity} cc · {fav.vehicle.power} KM
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
