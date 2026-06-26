import Link from "next/link"
import { Bike, Shield, User, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

const accounts = [
  {
    role: "Super Admin",
    email: "super_admin@ridebooker.pl",
    password: "12345678",
    description:
      "Pełny dostęp do systemu - organizacje, lokalizacje, użytkownicy, pojazdy",
    href: "/admin/login",
    label: "Panel administracyjny",
    icon: Shield,
  },
  {
    role: "Branch Admin",
    email: "branch@ridebooker.pl",
    password: "12345678",
    description:
      "Zarządzanie salonem Yamaha Kraków - sloty, inwentarz, rezerwacje",
    href: "/admin/login",
    label: "Panel administracyjny",
    icon: Shield,
  },
  {
    role: "Użytkownik",
    email: "user@ridebooker.pl",
    password: "12345678",
    description:
      "Klient - przeglądanie modeli, rezerwacja jazdy próbnej, ulubione",
    href: "/login",
    label: "Panel klienta",
    icon: User,
  },
]

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Bike
              className="w-10 h-10"
              style={{ color: "hsl(var(--brand-accent))" }}
              strokeWidth={1.5}
            />
          </div>
          <h1 className="text-3xl font-semibold">Ride Booker</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            System rezerwacji jazd próbnych motocykli. Poniżej znajdziesz dane
            dostępowe do kont testowych.
          </p>
        </div>

        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.email}
              className="rounded-lg border border-border/60 p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <account.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{account.role}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {account.description}
                  </p>
                </div>
                <Link href={account.href} className="shrink-0">
                  <Button size="sm" variant="outline" className="gap-2">
                    <ExternalLink className="w-3.5 h-3.5" />
                    {account.label}
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Email
                  </p>
                  <p className="text-sm font-mono bg-muted/50 rounded px-2 py-1.5 select-all">
                    {account.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Hasło
                  </p>
                  <p className="text-sm font-mono bg-muted/50 rounded px-2 py-1.5 select-all">
                    {account.password}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Strona demonstracyjna — dane testowe tylko do celów prezentacji
        </p>
      </div>
    </div>
  )
}
