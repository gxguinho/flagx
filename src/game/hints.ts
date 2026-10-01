import { pick, type Rng } from './rng.ts'
import type { Country, Hint, Level } from './types.ts'

const LEVELS: Level[] = [1, 2, 3, 4, 5]

/** Uma dica de cada nível (1→5), evitando repetir a categoria da anterior quando possível */
export function selectHints(country: Country, rng: Rng): Hint[] {
  const chosen: Hint[] = []
  for (const level of LEVELS) {
    const candidates = country.hints.filter((h) => h.level === level)
    const previous = chosen.at(-1)?.category
    const preferred = candidates.filter((h) => h.category !== previous)
    chosen.push(pick(rng, preferred.length ? preferred : candidates))
  }
  return chosen
}
