"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"
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

const schema = z
  .object({
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  })

type FormValues = z.infer<typeof schema>
type PageState = "loading" | "ready" | "invalid"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ResetPasswordPage() {
  const router = useRouter()
  const [state, setState] = useState<PageState>(() => {
    if (typeof window === "undefined") {
      return "loading"
    }

    const hash = window.location.hash
    return hash && hash.includes("type=recovery") ? "loading" : "invalid"
  })

  useEffect(() => {
    if (state === "invalid") {
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setState("ready")
      }
    })

    return () => subscription.unsubscribe()
  }, [state])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  const onSubmit = async (values: FormValues) => {
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    })

    if (error) {
      toast.error("Błąd podczas zmiany hasła — link mógł wygasnąć")
      return
    }

    toast.success("Hasło zostało zmienione")
    router.push("/login")
  }

  if (state === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-6 p-8 text-center">
          <h1 className="text-2xl font-semibold">Nieprawidłowy link</h1>
          <p className="text-muted-foreground text-sm">
            Link do resetowania hasła jest nieprawidłowy lub wygasł.
          </p>
          <Link href="/forgot-password">
            <Button variant="outline" className="w-full">
              Wyślij nowy link
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Weryfikacja linku...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Nowe hasło</h1>
          <p className="text-muted-foreground text-sm">
            Wpisz nowe hasło dla swojego konta.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nowe hasło</FormLabel>
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
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potwierdź hasło</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Powtórz hasło"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Zapisywanie..." : "Zmień hasło"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
