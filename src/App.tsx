import { CalendarDays, CircleHelp, Infinity as InfinityIcon, BarChart3 } from "lucide-react"

import { Flag } from "@/components/Flag"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

function App() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center gap-8 px-4 py-10">
      <header className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          flag<span className="text-primary">x</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Descubra o país através do futebol.</p>
      </header>

      <Card className="w-full max-w-64">
        <CardContent>
          <Flag code="br" />
        </CardContent>
      </Card>

      <nav className="flex w-full flex-col gap-3">
        <Button size="lg" disabled>
          <CalendarDays /> Desafio diário
        </Button>
        <Button size="lg" variant="outline" disabled>
          <InfinityIcon /> Modo livre
        </Button>
        <Button size="lg" variant="outline" disabled>
          <BarChart3 /> Estatísticas
        </Button>
        <Button size="lg" variant="ghost" disabled>
          <CircleHelp /> Como jogar
        </Button>
      </nav>

      <p className="text-sm text-muted-foreground">Em construção ⚽</p>
    </main>
  )
}

export default App
