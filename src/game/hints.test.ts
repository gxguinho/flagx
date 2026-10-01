import { describe, expect, it } from 'vitest'

import { selectHints } from './hints.ts'
import { createRng } from './rng.ts'
import type { Country, Hint, HintCategory, Level } from './types.ts'

const h = (id: string, level: Level, category: HintCategory): Hint => ({
  id,
  text: `dica ${id}`,
  level,
  category,
  reviewed: false,
})

const country = (hints: Hint[]): Country => ({
  id: 'xx',
  name: 'Xis',
  aliases: [],
  confederation: 'UEFA',
  flagDifficulty: 3,
  hints,
})

const full = country([
  h('xx-01', 1, 'confederacao'),
  h('xx-02', 1, 'curiosidade'),
  h('xx-03', 2, 'copa'),
  h('xx-04', 2, 'titulo'),
  h('xx-05', 3, 'clube'),
  h('xx-06', 3, 'rivalidade'),
  h('xx-07', 4, 'jogador'),
  h('xx-08', 4, 'momento'),
  h('xx-09', 5, 'jogador'),
  h('xx-10', 5, 'momento'),
])

describe('selectHints', () => {
  it('devolve 5 dicas, uma por nível, em ordem', () => {
    expect(selectHints(full, createRng(1)).map((x) => x.level)).toEqual([1, 2, 3, 4, 5])
  })

  it('é determinístico pela semente e varia entre sementes', () => {
    const ids = (seed: number) => selectHints(full, createRng(seed)).map((x) => x.id).join()
    expect(ids(9)).toBe(ids(9))
    const combos = new Set(Array.from({ length: 50 }, (_, i) => ids(i)))
    expect(combos.size).toBeGreaterThan(1)
  })

  it('evita repetir a categoria da dica anterior quando há alternativa', () => {
    const c = country([
      h('xx-01', 1, 'jogador'),
      h('xx-02', 2, 'jogador'),
      h('xx-03', 2, 'titulo'),
      h('xx-04', 3, 'clube'),
      h('xx-05', 4, 'momento'),
      h('xx-06', 5, 'copa'),
    ])
    for (let seed = 0; seed < 50; seed++) {
      expect(selectHints(c, createRng(seed))[1].id).toBe('xx-03')
    }
  })

  it('aceita repetir a categoria quando não há alternativa', () => {
    const c = country([
      h('xx-01', 1, 'jogador'),
      h('xx-02', 2, 'jogador'),
      h('xx-03', 3, 'clube'),
      h('xx-04', 4, 'momento'),
      h('xx-05', 5, 'copa'),
    ])
    expect(selectHints(c, createRng(1))).toHaveLength(5)
  })
})
