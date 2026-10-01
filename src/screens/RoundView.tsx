import type { ReactNode } from 'react'

import { ChoiceGrid } from '@/components/ChoiceGrid'
import { Flag } from '@/components/Flag'
import { GuessInput } from '@/components/GuessInput'
import { HintList } from '@/components/HintList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getMember, members } from '@/data/countries'
import { revealedHints, roundScore, type RoundState } from '@/game/round'

interface RoundViewProps {
  round: RoundState
  header: ReactNode
  onGuess(id: string): void
  onNext(): void
  /** "Próxima" ou "Ver resultado" */
  nextLabel: string
}

export function RoundView({ round, header, onGuess, onNext, nextLabel }: RoundViewProps) {
  const finished = round.status !== 'playing'
  const answer = getMember(round.countryId)

  return (
    <div className="flex flex-col gap-4">
      {header}

      <Card className="mx-auto w-full max-w-72 py-4">
        <CardContent className="px-4">
          <Flag code={round.countryId} />
        </CardContent>
      </Card>

      <HintList hints={revealedHints(round)} />

      {round.wrongIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Palpites errados">
          {round.wrongIds.map((id) => (
            <Badge key={id} variant="outline" className="line-through">
              {getMember(id).name}
            </Badge>
          ))}
        </div>
      )}

      {round.mode === 'facil' ? (
        <ChoiceGrid
          choices={round.choiceIds.map(getMember)}
          wrongIds={round.wrongIds}
          onGuess={onGuess}
          disabled={finished}
        />
      ) : (
        <GuessInput members={members} excludedIds={round.wrongIds} onGuess={onGuess} disabled={finished} />
      )}

      <Dialog open={finished}>
        <DialogContent showCloseButton={false} className="max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{round.status === 'won' ? 'Você acertou!' : 'Não foi dessa vez'}</DialogTitle>
            <DialogDescription>A resposta era</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3">
            <span className={`fi fi-${answer.id} shrink-0 text-2xl`} aria-hidden />
            <span className="text-lg font-semibold">{answer.name}</span>
            <span className="ml-auto text-lg font-bold text-primary">+{roundScore(round)}</span>
          </div>
          <HintList hints={round.hints} />
          <DialogFooter>
            <Button size="lg" onClick={onNext} autoFocus>
              {nextLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
