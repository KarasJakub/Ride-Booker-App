import Link from "next/link"
import { Bike, ArrowRight, CalendarCheck, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/60 px-6 h-16 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2 font-medium">
          <Bike
            className="w-5 h-5"
            style={{ color: "hsl(var(--brand-accent))" }}
            strokeWidth={2}
          />
          <span>Ride Booker</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Zaloguj się
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Zarejestruj się</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 space-y-8 max-w-2xl mx-auto">
        <div className="space-y-4">
          <div className="flex justify-center">
            <Bike
              className="w-16 h-16"
              style={{ color: "hsl(var(--brand-accent))" }}
              strokeWidth={1.5}
            />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Zarezerwuj jazdę próbną
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Wybierz motocykl, znajdź salon w swojej okolicy i umów się na jazdę
            próbną w kilka kliknięć.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/register">
            <Button
              size="lg"
              className="gap-2 w-full sm:w-auto"
              style={{ backgroundColor: "hsl(var(--brand-accent))" }}
            >
              Zacznij teraz
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Mam już konto
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 w-full">
          <div className="space-y-2 text-center">
            <Bike
              className="w-6 h-6 mx-auto text-muted-foreground"
              strokeWidth={1.5}
            />
            <p className="font-medium text-sm">Szeroki wybór modeli</p>
            <p className="text-xs text-muted-foreground">
              Przeglądaj dostępne motocykle i filtruj według swoich preferencji
            </p>
          </div>
          <div className="space-y-2 text-center">
            <CalendarCheck
              className="w-6 h-6 mx-auto text-muted-foreground"
              strokeWidth={1.5}
            />
            <p className="font-medium text-sm">Rezerwacja online</p>
            <p className="text-xs text-muted-foreground">
              Wybierz termin który Ci odpowiada i zarezerwuj w kilka kliknięć
            </p>
          </div>
          <div className="space-y-2 text-center">
            <Shield
              className="w-6 h-6 mx-auto text-muted-foreground"
              strokeWidth={1.5}
            />
            <p className="font-medium text-sm">Potwierdzenie salonu</p>
            <p className="text-xs text-muted-foreground">
              Salon potwierdzi Twoją rezerwację i wyśle powiadomienie emailem
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/60 px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Ride Booker — system rezerwacji jazd próbnych motocykli
        </p>
      </footer>
    </div>
  )
}
