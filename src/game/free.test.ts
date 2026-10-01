import { describe, expect, it } from 'vitest'

import { pickFreeCountry, pushRecent, RECENT_LIMIT } from './free.ts'
import { createRng } from './rng.ts'
import type { Country } from './types.ts'

const make = (n: number): Country[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `c${i}`,
    name: `País ${i}`,
    aliases: [],
    confederation: 'UEFA',
    flagDifficulty: 1,
    hints: [],
  }))

describe('pickFreeCountry', () => {
  it('nunca sorteia um país recente', () => {
    const countries = make(25)
    const recent = countries.slice(0, 20).map((c) => c.id)
    for (let seed = 0; seed < 100; seed++) {
      expect(recent).not.toContain(pickFreeCountry(countries, recent, createRng(seed)).id)
    }
  })

  it('sorteia entre todos quando todos são recentes', () => {
    const countries = make(10)
    const recent = countries.map((c) => c.id)
    expect(countries).toContain(pickFreeCountry(countries, recent, createRng(1)))
  })
})

describe('pushRecent', () => {
  it('mantém só os últimos 20, com o novo no fim', () => {
    const recent = Array.from({ length: 20 }, (_, i) => `c${i}`)
    const next = pushRecent(recent, 'novo')
    expect(RECENT_LIMIT).toBe(20)
    expect(next).toHaveLength(20)
    expect(next).not.toContain('c0')
    expect(next.at(-1)).toBe('novo')
  })
})
