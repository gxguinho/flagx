import { BarChart3, CalendarDays, CircleHelp, Infinity as InfinityIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { DailyStatus } from './dailyStatus'

const DAILY_LABEL: Record<DailyStatus, string> = {
  novo: 'Jogar',
  andamento: 'Continuar',
  concluido: 'Ver resultado',
}

interface HomeProps {
  puzzle: number
  status: DailyStatus
  onDaily(): void
  onFree(): void
  onStats(): void
  onHelp(): void
}

export function Home({ puzzle, status, onDaily, onFree, onStats, onHelp }: HomeProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10">
      <header className="text-center">
        <h1 className="text-6xl font-bold tracking-tight">
          flag<span className="text-primary">x</span>
        </h1>
        <p className="mt-3 text-muted-foreground">Descubra o país através do futebol.</p>
      </header>

      <nav className="flex w-full flex-col gap-3">
        <Button size="lg" className="h-auto justify-between py-3" onClick={onDaily}>
          <span className="flex items-center gap-2">
            <CalendarDays /> Desafio #{puzzle}
          </span>
          <span className="text-xs font-normal opacity-90">{DAILY_LABEL[status]}</span>
        </Button>
        <Button size="lg" variant="outline" onClick={onFree}>
          <InfinityIcon /> Modo livre
        </Button>
        <Button size="lg" variant="outline" onClick={onStats}>
          <BarChart3 /> Estatísticas
        </Button>
        <Button size="lg" variant="ghost" onClick={onHelp}>
          <CircleHelp /> Como jogar
        </Button>
      </nav>
    </div>
  )
}
