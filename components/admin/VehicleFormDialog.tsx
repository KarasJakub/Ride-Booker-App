"use client"

import { useEffect } from "react"
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

const vehicleSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  typeId: z.string().min(1, "Typ jest wymagany"),
  engineCapacity: z.number().min(1, "Pojemność jest wymagana"),
  power: z.number().min(1, "Moc jest wymagana"),
  description: z.string().optional(),
  imageUrl: z.string().url("Nieprawidłowy URL").optional().or(z.literal("")),
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
  const queryClient = useQueryClient()
  const isEdit = !!editVehicle

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: "",
      typeId: "",
      engineCapacity: 0,
      power: 0,
      description: "",
      imageUrl: "",
    },
  })

  useEffect(() => {
    if (editVehicle) {
      form.reset({
        name: editVehicle.name,
        typeId: editVehicle.typeId,
        engineCapacity: editVehicle.engineCapacity,
        power: editVehicle.power,
        description: editVehicle.description ?? "",
        imageUrl: editVehicle.imageUrl ?? "",
      })
    } else {
      form.reset({
        name: "",
        typeId: "",
        engineCapacity: 0,
        power: 0,
        description: "",
        imageUrl: "",
      })
    }
  }, [editVehicle, open, form])

  const mutation = useMutation({
    mutationFn: (values: VehicleFormValues) => {
      const payload = {
        ...values,
        imageUrl: values.imageUrl || undefined,
        description: values.description || undefined,
      }
      return isEdit
        ? api.patch(`/vehicles/${editVehicle!.id}`, payload)
        : api.post("/vehicles", payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      toast.success(isEdit ? "Pojazd zaktualizowany" : "Pojazd dodany")
      onClose()
    },
    onError: () => toast.error("Błąd podczas zapisywania"),
  })

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

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL zdjęcia</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
