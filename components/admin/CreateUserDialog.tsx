"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import api from "@/lib/apiClient"

const createUserSchema = z.object({
  fullName: z.string().min(2, "Imię i nazwisko jest wymagane"),
  email: z.string().email("Nieprawidłowy adres email"),
  phone: z.string().optional(),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
})

type CreateUserFormValues = z.infer<typeof createUserSchema>

interface Props {
  open: boolean
  onClose: () => void
}

export default function CreateUserDialog({ open, onClose }: Props) {
  const queryClient = useQueryClient()

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "" },
  })

  const mutation = useMutation({
    mutationFn: (values: CreateUserFormValues) =>
      api.post("/auth/users", {
        ...values,
        phone: values.phone || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("Użytkownik utworzony")
      form.reset()
      onClose()
    },
    onError: () => toast.error("Błąd podczas tworzenia użytkownika"),
  })

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Utwórz użytkownika</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imię i nazwisko</FormLabel>
                  <FormControl>
                    <Input placeholder="Jan Kowalski" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="jan@example.pl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Telefon{" "}
                    <span className="text-muted-foreground">(opcjonalny)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="+48123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hasło</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Min. 8 znaków"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-xs text-muted-foreground">
              Użytkownik otrzyma bazową rolę &quot;Użytkownik&quot;. Rolę możesz
              zmienić później z listy.
            </p>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Anuluj
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Tworzenie..." : "Utwórz"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
