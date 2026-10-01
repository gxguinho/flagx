import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { countries, members } from '@/data/countries'
import {
  createDailyRun,
  currentRoundIndex,
  DAILY_SIZE,
  dailyTotals,
  dateKey,
  puzzleNumber,
  type DailyRecord,
} from '@/game/daily'
import { roundReducer } from '@/game/round'
import type { Mode } from '@/game/types'
import type { UpdateSave } from '@/state/useSave'
import { recordDailyFinished, type SaveData } from '@/storage/storage'

import { DailySummary } from './DailySummary'
import { RoundView } from './RoundView'

const points = new Intl.NumberFormat('pt-BR')
const defaultNow = () => new Date()

interface DailyScreenProps {
  save: SaveData
  updateSave: UpdateSave
  now?: () => Date
  onBack(): void
}

export function DailyScreen({ save, updateSave, now = defaultNow, onBack }: DailyScreenProps) {
  const [puzzle] = useState(() => puzzleNumber(dateKey(now())))
  // Rodada exibida; fica parada na rodada recém-terminada até o jogador clicar em "Próxima"
  const [viewIndex, setViewIndex] = useState<number | null>(null)

  const record = save.daily?.puzzle === puzzle ? save.daily : null

  const back = (
    <Button variant="ghost" size="icon" onClick={onBack} aria-label="Voltar">
      <ArrowLeft />
    </Button>
  )

  if (!record) {
    const start = (mode: Mode) =>
      updateSave((s) => ({ ...s, daily: createDailyRun(puzzle, mode, countries, members) }))
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          {back}
          <h2 className="text-lg font-semibold">Desafio #{puzzle}</h2>
        </div>
        <p className="text-muted-foreground">
          Cinco bandeiras, da mais fácil à mais difícil. Você só pode jogar uma vez por dia. Escolha o nível:
        </p>
        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={() => start('normal')}>
            Normal
          </Button>
          <Button size="lg" variant="outline" onClick={() => start('facil')}>
            Fácil
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            No fácil você escolhe entre 4 opções e os pontos valem metade.
          </p>
        </div>
      </div>
    )
  }

  const current = currentRoundIndex(record)
  const index = viewIndex ?? (current === -1 ? DAILY_SIZE : current)

  if (index >= DAILY_SIZE) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {back}
          <h2 className="text-lg font-semibold">Resultado do dia</h2>
        </div>
        <DailySummary record={record} now={now} />
      </div>
    )
  }

  const round = record.rounds[index]
  const finishedCount = record.rounds.filter((r) => r.status !== 'playing').length

  const handleGuess = (memberId: string) => {
    const next = roundReducer(round, { type: 'guess', memberId })
    if (next === round) return
    setViewIndex(index)
    const nextRecord: DailyRecord = { ...record, rounds: record.rounds.map((r, i) => (i === index ? next : r)) }
    updateSave((s) => {
      const saved = { ...s, daily: nextRecord }
      if (currentRoundIndex(nextRecord) !== -1) return saved
      const { total, squares } = dailyTotals(nextRecord)
      return recordDailyFinished(saved, puzzle, total, squares)
    })
  }

  const header = (
    <header className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {back}
        <h2 className="text-lg font-semibold">
          Diário #{puzzle} · {index + 1}/{DAILY_SIZE}
        </h2>
        <span className="ml-auto text-sm">
          <strong>{points.format(dailyTotals(record).total)}</strong> pts
        </span>
      </div>
      <Progress value={(finishedCount / DAILY_SIZE) * 100} aria-label="Progresso do desafio" />
    </header>
  )

  return (
    <RoundView
      round={round}
      header={header}
      onGuess={handleGuess}
      onNext={() => setViewIndex(index + 1)}
      nextLabel={index + 1 >= DAILY_SIZE ? 'Ver resultado' : 'Próxima'}
    />
  )
}
