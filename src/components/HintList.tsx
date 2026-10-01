import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CATEGORY_LABEL } from '@/game/categories'
import type { Hint } from '@/game/types'

export function HintList({ hints }: { hints: Hint[] }) {
  if (hints.length === 0) return null
  return (
    <ol className="flex flex-col gap-2">
      {hints.map((hint, i) => (
        <li key={hint.id}>
          <Card size="sm" className="gap-1.5 py-3">
            <CardContent className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Dica {i + 1}</span>
                <Badge variant="secondary">{CATEGORY_LABEL[hint.category]}</Badge>
              </div>
              <p className="text-sm leading-snug">{hint.text}</p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ol>
  )
}
