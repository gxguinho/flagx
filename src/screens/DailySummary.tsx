import { Countdown } from '@/components/Countdown'
import { ShareButton } from '@/components/ShareButton'
import { Card, CardContent } from '@/components/ui/card'
import { getMember } from '@/data/countries'
import { dailyTotals, type DailyRecord } from '@/game/daily'
import { roundScore, squareFor } from '@/game/round'
import { buildShareText } from '@/game/share'

const points = new Intl.NumberFormat('pt-BR')

interface DailySummaryProps {
  record: DailyRecord
  now?: () => Date
}

export function DailySummary({ record, now }: DailySummaryProps) {
  const { total, squares } = dailyTotals(record)
  const text = buildShareText({ puzzle: record.puzzle, mode: record.mode, total, squares, url: window.location.origin })

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            Desafio #{record.puzzle}
            {record.mode === 'facil' && ' · fácil'}
          </p>
          <p className="text-4xl font-bold text-primary">{points.format(total)} pts</p>
          <p className="text-3xl tracking-widest">{squares.join('')}</p>
        </CardContent>
      </Card>

      <ol className="flex flex-col gap-1.5">
        {record.rounds.map((round) => (
          <li key={round.countryId} className="flex items-center gap-3 rounded-lg border px-3 py-2">
            <span className={`fi fi-${round.countryId} shrink-0`} aria-hidden />
            <span className="flex-1">{getMember(round.countryId).name}</span>
            <span aria-hidden>{squareFor(round)}</span>
            <span className="w-14 text-right font-semibold tabular-nums">{roundScore(round)}</span>
          </li>
        ))}
      </ol>

      <ShareButton text={text} />
      <Countdown now={now} />
    </div>
  )
}
