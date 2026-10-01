import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { countries, members } from '@/data/countries'
import { buildChoices } from '@/game/choices'
import { pickFreeCountry, pushRecent } from '@/game/free'
import { selectHints } from '@/game/hints'
import { createRng, randomSeed } from '@/game/rng'
import { createRound, roundReducer, roundScore, type RoundState } from '@/game/round'
import type { Mode } from '@/game/types'
import type { UpdateSave } from '@/state/useSave'
import type { SaveData } from '@/storage/storage'

import { announceHit } from './announceHit'
import { RoundView } from './RoundView'

const points = new Intl.NumberFormat('pt-BR')

function newRound(mode: Mode, recentIds: string[]): RoundState {
  const rng = createRng(randomSeed())
  const country = pickFreeCountry(countries, recentIds, rng)
  const hints = selectHints(country, rng)
  const choiceIds = mode === 'facil' ? buildChoices(country, members, rng).map((m) => m.id) : []
  return createRound({ countryId: country.id, mode, hints, choiceIds })
}

interface FreeScreenProps {
  save: SaveData
  updateSave: UpdateSave
  onBack(): void
}

export function FreeScreen({ save, updateSave, onBack }: FreeScreenProps) {
  const [mode, setMode] = useState<Mode>('normal')
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [round, setRound] = useState(() => newRound('normal', []))
  const [sessionScore, setSessionScore] = useState(0)

  const handleGuess = (memberId: string) => {
    const next = roundReducer(round, { type: 'guess', memberId })
    if (next === round) return
    if (next.status === 'playing') {
      setRound(next)
      return
    }

    const total = sessionScore + roundScore(next)
    setSessionScore(total)
    if (total > save.freeBest) updateSave((s) => ({ ...s, freeBest: Math.max(s.freeBest, total) }))

    if (next.status === 'won') {
      announceHit(next)
      startNext(mode)
    } else {
      setRound(next)
    }
  }

  const startNext = (nextMode: Mode) => {
    const recent = pushRecent(recentIds, round.countryId)
    setRecentIds(recent)
    setRound(newRound(nextMode, recent))
  }

  const switchMode = (nextMode: Mode) => {
    if (nextMode === mode) return
    setMode(nextMode)
    startNext(nextMode)
  }

  const header = (
    <header className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Voltar">
          <ArrowLeft />
        </Button>
        <h2 className="text-lg font-semibold">Modo livre</h2>
        <div className="ml-auto text-right text-sm">
          <div>
            Sessão: <strong data-testid="session-score">{points.format(sessionScore)}</strong> pts
          </div>
          <div className="text-muted-foreground">Recorde: {points.format(Math.max(save.freeBest, sessionScore))}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Nível">
        <Button variant={mode === 'normal' ? 'default' : 'outline'} onClick={() => switchMode('normal')}>
          Normal
        </Button>
        <Button variant={mode === 'facil' ? 'default' : 'outline'} onClick={() => switchMode('facil')}>
          Fácil
        </Button>
      </div>
    </header>
  )

  return (
    <RoundView
      round={round}
      header={header}
      onGuess={handleGuess}
      onNext={() => startNext(mode)}
      nextLabel="Próxima"
    />
  )
}
