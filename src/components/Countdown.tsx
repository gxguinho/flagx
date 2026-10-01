import { useEffect, useState } from 'react'

import { msUntilNextPuzzle } from '@/game/daily'

const pad = (n: number) => String(n).padStart(2, '0')

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
}

const defaultNow = () => new Date()

export function Countdown({ now = defaultNow }: { now?: () => Date }) {
  const [ms, setMs] = useState(() => msUntilNextPuzzle(now()))

  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNextPuzzle(now())), 1000)
    return () => clearInterval(id)
  }, [now])

  return (
    <p className="text-center text-sm text-muted-foreground">
      Próximo desafio em <span className="font-mono font-semibold text-foreground">{format(ms)}</span>
    </p>
  )
}
