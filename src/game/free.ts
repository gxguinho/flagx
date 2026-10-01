import { pick, type Rng } from './rng.ts'
import type { Country } from './types.ts'

export const RECENT_LIMIT = 20

/** Sorteia um país fora dos recentes; se todos forem recentes, sorteia entre todos */
export function pickFreeCountry(countries: readonly Country[], recentIds: readonly string[], rng: Rng): Country {
  const fresh = countries.filter((c) => !recentIds.includes(c.id))
  return pick(rng, fresh.length ? fresh : countries)
}

export function pushRecent(recentIds: readonly string[], id: string): string[] {
  return [...recentIds, id].slice(-RECENT_LIMIT)
}
