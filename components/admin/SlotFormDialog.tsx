"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import api from "@/lib/apiClient"

interface InventoryItem {
  id: string
  vehicle: { name: string }
}

interface Slot {
  id: string
  startTime: string
  endTime: string
  isAvailable: boolean
  locationVehicleId: string
}

interface Props {
  open: boolean
  onClose: () => void
  inventory: InventoryItem[]
  editSlot?: Slot | null
  defaultInventoryId?: string | null
  locationId: string
}

export default function SlotFormDialog({
  open,
  onClose,
  inventory,
  editSlot,
  defaultInventoryId,
  locationId,
}: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!editSlot

  const getInitialState = () => {
    if (editSlot) {
      const start = new Date(editSlot.startTime)
      const end = new Date(editSlot.endTime)
      return {
        locationVehicleId: editSlot.locationVehicleId,
        date: start.toISOString().split("T")[0],
        startHour: `${String(start.getHours()).padStart(2, "0")}:${String(
          start.getMinutes()
        ).padStart(2, "0")}`,
        endHour: `${String(end.getHours()).padStart(2, "0")}:${String(
          end.getMinutes()
        ).padStart(2, "0")}`,
        isAvailable: editSlot.isAvailable,
      }
    }
    return {
      locationVehicleId: defaultInventoryId ?? "",
      date: "",
      startHour: "10:00",
      endHour: "11:00",
      isAvailable: true,
    }
  }

  const [locationVehicleId, setLocationVehicleId] = useState(
    () => getInitialState().locationVehicleId
  )
  const [date, setDate] = useState(() => getInitialState().date)
  const [startHour, setStartHour] = useState(() => getInitialState().startHour)
  const [endHour, setEndHour] = useState(() => getInitialState().endHour)
  const [isAvailable, setIsAvailable] = useState(
    () => getInitialState().isAvailable
  )

  const buildDateTimes = () => {
    const startTime = new Date(`${date}T${startHour}:00.000Z`).toISOString()
    const endTime = new Date(`${date}T${endHour}:00.000Z`).toISOString()
    return { startTime, endTime }
  }

  const mutation = useMutation({
    mutationFn: () => {
      const { startTime, endTime } = buildDateTimes()
      if (isEdit) {
        return api.patch(`/slots/${editSlot!.id}`, {
          startTime,
          endTime,
          isAvailable,
        })
      }
      return api.post("/slots", {
        locationVehicleId,
        startTime,
        endTime,
        isAvailable,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots", locationId] })
      toast.success(isEdit ? "Slot zaktualizowany" : "Slot dodany")
      onClose()
    },
    onError: () => toast.error("Błąd podczas zapisywania"),
  })

  const isValid =
    locationVehicleId && date && startHour && endHour && startHour < endHour

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edytuj slot" : "Dodaj slot"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Pojazd</Label>
            <Select
              value={locationVehicleId}
              onValueChange={setLocationVehicleId}
              disabled={isEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz pojazd" />
              </SelectTrigger>
              <SelectContent>
                {inventory.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.vehicle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Data</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Godzina od</Label>
              <Input
                type="time"
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Godzina do</Label>
              <Input
                type="time"
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isAvailable"
              checked={isAvailable}
              onCheckedChange={(v) => setIsAvailable(!!v)}
            />
            <Label htmlFor="isAvailable">Dostępny</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
          >
            {mutation.isPending
              ? "Zapisywanie..."
              : isEdit
              ? "Zapisz zmiany"
              : "Dodaj"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
