import { buildChoices } from './choices.ts'
import { selectHints } from './hints.ts'
import { createRng, hashString, shuffle } from './rng.ts'
import { createRound, roundScore, squareFor, type RoundState, type Square } from './round.ts'
import type { Country, Level, Member, Mode } from './types.ts'

export const LAUNCH_DATE = '2026-10-01'
export const TIMEZONE = 'America/Sao_Paulo'
export const DAILY_SIZE = 5

const DAY_MS = 86_400_000
const DIFFICULTIES: Level[] = [1, 2, 3, 4, 5]

// Comparação por code point: a ordem não pode depender do idioma do navegador,
// senão jogadores em locales diferentes receberiam desafios diferentes
const byId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)

const keyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** "YYYY-MM-DD" no fuso de Brasília */
export function dateKey(now: Date): string {
  return keyFormatter.format(now)
}

const keyToUtc = (key: string) => Date.parse(`${key}T00:00:00Z`)

/** Desafio #1 = LAUNCH_DATE */
export function puzzleNumber(key: string): number {
  return Math.round((keyToUtc(key) - keyToUtc(LAUNCH_DATE)) / DAY_MS) + 1
}

export function msUntilNextPuzzle(now: Date): number {
  const tomorrow = new Date(keyToUtc(dateKey(now)) + DAY_MS).toISOString().slice(0, 10)
  // Brasília é UTC-3 o ano todo (sem horário de verão desde 2019)
  return Date.parse(`${tomorrow}T00:00:00-03:00`) - now.getTime()
}

/**
 * Um país por faixa de flagDifficulty (1→5). Cada faixa é embaralhada com
 * semente fixa e o desafio N pega a posição N; nada se repete até a faixa
 * dar a volta. Adicionar países muda a sequência dos dias futuros.
 */
export function dailyCountries(puzzle: number, countries: readonly Country[]): Country[] {
  return DIFFICULTIES.flatMap((d) => {
    const bucket = countries.filter((c) => c.flagDifficulty === d).sort(byId)
    if (bucket.length === 0) return []
    const order = shuffle(createRng(hashString(`bucket-${d}`)), bucket)
    return [order[(puzzle - 1) % order.length]]
  })
}

export interface DailyRecord {
  puzzle: number
  mode: Mode
  rounds: RoundState[]
}

export function createDailyRun(
  puzzle: number,
  mode: Mode,
  countries: readonly Country[],
  members: readonly Member[],
): DailyRecord {
  const rounds = dailyCountries(puzzle, countries).map((country) => {
    const rng = createRng(hashString(`${puzzle}:${country.id}`))
    const hints = selectHints(country, rng)
    const choiceIds = mode === 'facil' ? buildChoices(country, members, rng).map((m) => m.id) : []
    return createRound({ countryId: country.id, mode, hints, choiceIds })
  })
  return { puzzle, mode, rounds }
}

/** Índice da rodada em andamento; -1 quando todas terminaram */
export function currentRoundIndex(record: DailyRecord): number {
  return record.rounds.findIndex((r) => r.status === 'playing')
}

export function dailyTotals(record: DailyRecord): { total: number; squares: Square[] } {
  return {
    total: record.rounds.reduce((sum, r) => sum + roundScore(r), 0),
    squares: record.rounds.map(squareFor),
  }
}
