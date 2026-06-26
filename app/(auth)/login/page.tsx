"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
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
import api from "@/lib/apiClient"
import { useAuthStore } from "@/store/authStore"
import Link from "next/link"

const loginSchema = z.object({
  email: z.string().email({ message: "Podaj poprawny adres email" }),
  password: z.string().min(1, { message: "Hasło jest wymagane" }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const { data } = await api.post("/auth/login", values)
      setAuth(data.user, data.accessToken)
      router.push("/user/dashboard")
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      form.setError("root", {
        message: "Nieprawidłowy email lub hasło",
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Logowanie</h1>
          <p className="text-muted-foreground text-sm">
            Panel klienta — zaloguj się aby zarezerwować jazdę próbną
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="jan@kowalski.pl" {...field} />
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
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Logowanie..." : "Zaloguj się"}
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-muted-foreground">
          Jesteś administratorem?{" "}
          <Link
            href="/admin/login"
            className="underline underline-offset-4 hover:text-primary"
          >
            Zaloguj się do panelu admina
          </Link>
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Nie masz jeszcze konta?{" "}
          <Link
            href="/register"
            className="underline underline-offset-4 hover:text-primary"
          >
            Zarejestruj się
          </Link>
        </p>
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/forgot-password"
            className="underline underline-offset-4 hover:text-primary"
          >
            Zapomniałeś hasła?
          </Link>
        </p>
      </div>
    </div>
  )
}
