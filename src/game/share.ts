import type { Square } from './round.ts'
import type { Mode } from './types.ts'

const points = new Intl.NumberFormat('pt-BR')

export function buildShareText(args: {
  puzzle: number
  mode: Mode
  total: number
  squares: Square[]
  url: string
}): string {
  const mode = args.mode === 'facil' ? ' (fácil)' : ''
  return [
    `flagx #${args.puzzle} · ${points.format(args.total)} pts${mode}`,
    args.squares.join(''),
    args.url,
  ].join('\n')
}
