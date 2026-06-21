"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import api from "@/lib/apiClient"
import Image from "next/image"
import imageCompression from "browser-image-compression"

const vehicleSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  typeId: z.string().min(1, "Typ jest wymagany"),
  engineCapacity: z.number().min(1, "Pojemność jest wymagana"),
  power: z.number().min(1, "Moc jest wymagana"),
  description: z.string().optional(),
  //imageUrl: z.string().url("Nieprawidłowy URL").optional().or(z.literal("")),
})

type VehicleFormValues = z.infer<typeof vehicleSchema>

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
  description?: string
  imageUrl?: string
}

interface Props {
  open: boolean
  onClose: () => void
  types: VehicleType[]
  editVehicle?: Vehicle | null
}

export default function VehicleFormDialog({
  open,
  onClose,
  types,
  editVehicle,
}: Props) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    () => editVehicle?.imageUrl ?? null
  )
  const queryClient = useQueryClient()
  const isEdit = !!editVehicle

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: editVehicle
      ? {
          name: editVehicle.name,
          typeId: editVehicle.typeId,
          engineCapacity: editVehicle.engineCapacity,
          power: editVehicle.power,
          description: editVehicle.description ?? "",
        }
      : {
          name: "",
          typeId: "",
          engineCapacity: 0,
          power: 0,
          description: "",
        },
  })

  const mutation = useMutation({
    mutationFn: async (values: VehicleFormValues) => {
      const payload = {
        ...values,
        description: values.description || undefined,
      }

      const response = isEdit
        ? await api.patch(`/vehicles/${editVehicle!.id}`, payload)
        : await api.post("/vehicles", payload)

      const vehicleId = response.data.id

      if (imageFile) {
        const formData = new FormData()
        formData.append("file", imageFile)
        await api.post(`/vehicles/${vehicleId}/image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      }

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      toast.success(isEdit ? "Pojazd zaktualizowany" : "Pojazd dodany")
      onClose()
    },
    onError: () => toast.error("Błąd podczas zapisywania"),
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Dozwolone formaty: JPG, PNG, WEBP")
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Plik jest za duży — maksymalny rozmiar to 15MB")
      return
    }

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      })
      setImageFile(compressed)
      setImagePreview(URL.createObjectURL(compressed))
    } catch {
      toast.error("Błąd podczas przetwarzania zdjęcia")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edytuj pojazd" : "Dodaj pojazd"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Yamaha MT-07" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="typeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Typ pojazdu</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz typ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {types.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="engineCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pojemność (cc)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="689"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="power"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moc (KM)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="73"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opis</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Opis pojazdu..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Zdjęcie pojazdu</FormLabel>

              {imagePreview && (
                <div className="relative w-full h-40 rounded-md overflow-hidden bg-muted">
                  <Image
                    fill
                    src={imagePreview}
                    alt="Podgląd"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <Input type="file" accept="image/*" onChange={handleFileChange} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Anuluj
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? "Zapisywanie..."
                  : isEdit
                  ? "Zapisz zmiany"
                  : "Dodaj"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
