import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Square } from '@/game/round'
import type { SaveData } from '@/storage/storage'

const points = new Intl.NumberFormat('pt-BR')

const SQUARES: { square: Square; label: string }[] = [
  { square: '🟩', label: 'Sem dica' },
  { square: '🟨', label: '1–2 dicas' },
  { square: '🟧', label: '3–5 dicas' },
  { square: '🟥', label: 'Errou' },
]

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm" data-stat>
      <CardContent className="flex flex-col items-center gap-1 text-center">
        <span className="text-2xl font-bold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  )
}

interface StatsScreenProps {
  save: SaveData
  onBack(): void
}

export function StatsScreen({ save, onBack }: StatsScreenProps) {
  const { stats } = save
  const average = stats.played ? Math.round(stats.totalPoints / stats.played) : 0
  const maxSquare = Math.max(1, ...SQUARES.map(({ square }) => stats.squares[square]))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Voltar">
          <ArrowLeft />
        </Button>
        <h2 className="text-lg font-semibold">Estatísticas</h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Desafios jogados" value={points.format(stats.played)} />
        <Stat label="Média de pontos" value={points.format(average)} />
        <Stat label="Sequência atual" value={points.format(stats.streak)} />
        <Stat label="Melhor sequência" value={points.format(stats.maxStreak)} />
      </div>
      <Stat label="Recorde no modo livre" value={points.format(save.freeBest)} />

      <Card size="sm">
        <CardContent className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Rodadas do desafio diário</h3>
          {SQUARES.map(({ square, label }) => (
            <div key={square} className="flex items-center gap-2 text-sm">
              <span aria-hidden>{square}</span>
              <span className="w-20 text-muted-foreground">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(stats.squares[square] / maxSquare) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right tabular-nums" data-testid={`square-${square}`}>
                {stats.squares[square]}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
