import type { Mode } from './types.ts'

export const MAX_ATTEMPTS: Record<Mode, number> = { normal: 6, facil: 4 }

const POINTS: Record<Mode, number[]> = {
  normal: [1000, 800, 600, 400, 250, 100],
  facil: [500, 400, 300, 200],
}

/** `attempt` = tentativa em que acertou (1-based); `null` = errou a rodada */
export function scoreFor(mode: Mode, attempt: number | null): number {
  if (attempt === null) return 0
  return POINTS[mode][attempt - 1] ?? 0
}
