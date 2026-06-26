import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/apiClient'

interface Favorite {
  id: string
  vehicleId: string
  vehicle: {
    id: string
    name: string
    engineCapacity: number
    power: number
    imageUrl?: string
    type: { id: string; name: string }
  }
}

export function useFavorites() {
  const queryClient = useQueryClient()

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['my-favorites'],
    queryFn: () => api.get('/favorites/me').then(r => r.data),
  })

  const favoriteIds = new Set(favorites.map((f: Favorite) => f.vehicleId))

  const addFavorite = useMutation({
    mutationFn: (vehicleId: string) => api.post('/favorites', { vehicleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-favorites'] })
      toast.success('Dodano do ulubionych')
    },
    onError: () => toast.error('Błąd podczas dodawania do ulubionych'),
  })

  const removeFavorite = useMutation({
    mutationFn: (vehicleId: string) => api.delete(`/favorites/${vehicleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-favorites'] })
      toast.success('Usunięto z ulubionych')
    },
    onError: () => toast.error('Błąd podczas usuwania z ulubionych'),
  })

  const toggleFavorite = (vehicleId: string) => {
    if (favoriteIds.has(vehicleId)) {
      removeFavorite.mutate(vehicleId)
    } else {
      addFavorite.mutate(vehicleId)
    }
  }

  return { favorites, favoriteIds, isLoading, toggleFavorite, isPending: addFavorite.isPending || removeFavorite.isPending }
}