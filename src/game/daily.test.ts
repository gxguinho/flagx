import { describe, expect, it } from 'vitest'

import {
  createDailyRun,
  currentRoundIndex,
  dailyCountries,
  dailyTotals,
  dateKey,
  msUntilNextPuzzle,
  puzzleNumber,
  type DailyRecord,
} from './daily.ts'
import { roundReducer } from './round.ts'
import type { Confederation, Country, Hint, Level } from './types.ts'

const LEVELS: Level[] = [1, 2, 3, 4, 5]

const makeCountry = (id: string, flagDifficulty: Level, confederation: Confederation = 'UEFA'): Country => ({
  id,
  name: `País ${id}`,
  aliases: [],
  confederation,
  flagDifficulty,
  hints: LEVELS.flatMap((level): Hint[] => [
    { id: `${id}-${level}a`, text: 'a', level, category: 'jogador', reviewed: false },
    { id: `${id}-${level}b`, text: 'b', level, category: 'clube', reviewed: false },
  ]),
})

// 3 países por faixa de dificuldade
const countries = LEVELS.flatMap((d) => ['a', 'b', 'c'].map((s) => makeCountry(`${s}${d}`, d)))

const solve = (record: DailyRecord, index: number): DailyRecord => ({
  ...record,
  rounds: record.rounds.map((r, i) =>
    i === index ? roundReducer(r, { type: 'guess', memberId: r.countryId }) : r,
  ),
})

describe('dateKey', () => {
  it('vira o dia à meia-noite de Brasília', () => {
    expect(dateKey(new Date('2026-10-02T02:59:00Z'))).toBe('2026-10-01')
    expect(dateKey(new Date('2026-10-02T03:00:00Z'))).toBe('2026-10-02')
  })
})

describe('puzzleNumber', () => {
  it('conta a partir do lançamento', () => {
    expect(puzzleNumber('2026-10-01')).toBe(1)
    expect(puzzleNumber('2026-10-31')).toBe(31)
    expect(puzzleNumber('2027-01-01')).toBe(93)
  })
})

describe('msUntilNextPuzzle', () => {
  it('conta até a próxima meia-noite de Brasília', () => {
    expect(msUntilNextPuzzle(new Date('2026-10-02T02:59:00Z'))).toBe(60_000)
  })
})

describe('dailyCountries', () => {
  it('escolhe 5 países com dificuldade crescente, de forma determinística', () => {
    const day = dailyCountries(7, countries)
    expect(day.map((c) => c.flagDifficulty)).toEqual([1, 2, 3, 4, 5])
    expect(dailyCountries(7, countries).map((c) => c.id)).toEqual(day.map((c) => c.id))
  })

  it('não repete país da faixa dentro do ciclo', () => {
    const first = [1, 2, 3].map((n) => dailyCountries(n, countries)[0].id)
    expect(new Set(first).size).toBe(3)
    expect(dailyCountries(4, countries)[0].id).toBe(first[0])
  })
})

describe('createDailyRun', () => {
  it('monta 5 rodadas idênticas para todos os jogadores', () => {
    const run = createDailyRun(1, 'facil', countries, countries)
    expect(run.rounds).toHaveLength(5)
    for (const round of run.rounds) {
      expect(round.hints).toHaveLength(5)
      expect(round.choiceIds).toHaveLength(4)
      expect(round.choiceIds).toContain(round.countryId)
    }
    expect(createDailyRun(1, 'facil', countries, countries)).toEqual(run)
  })
})

describe('currentRoundIndex', () => {
  it('retoma na primeira rodada não terminada, mesmo depois de ir e voltar do JSON', () => {
    const run = createDailyRun(1, 'normal', countries, countries)
    expect(currentRoundIndex(run)).toBe(0)
    const restored = JSON.parse(JSON.stringify(solve(run, 0))) as DailyRecord
    expect(currentRoundIndex(restored)).toBe(1)
    const done = [0, 1, 2, 3, 4].reduce(solve, run)
    expect(currentRoundIndex(done)).toBe(-1)
  })
})

describe('dailyTotals', () => {
  it('soma os pontos e lista os quadrados em ordem', () => {
    const run = createDailyRun(1, 'normal', countries, countries)
    const done = [0, 1, 2, 3, 4].reduce(solve, run)
    expect(dailyTotals(done)).toEqual({ total: 5000, squares: ['🟩', '🟩', '🟩', '🟩', '🟩'] })
  })
})
