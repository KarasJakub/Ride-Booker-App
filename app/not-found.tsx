import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Bike } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="flex justify-center">
          <Bike
            className="w-16 h-16 text-muted-foreground/40"
            strokeWidth={1.5}
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-semibold">404</h1>
          <h2 className="text-xl font-medium">Strona nie istnieje</h2>
          <p className="text-muted-foreground text-sm">
            Nie znaleźliśmy strony której szukasz. Może wróćmy na bezpieczne
            tory?
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/user/dashboard">
            <Button className="w-full sm:w-auto">Przeglądaj modele</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="w-full sm:w-auto">
              Zaloguj się
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
