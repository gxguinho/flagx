import { describe, expect, it } from 'vitest'

import { buildChoices } from './choices.ts'
import { createRng } from './rng.ts'
import type { Confederation, Member } from './types.ts'

const m = (id: string, confederation: Confederation): Member => ({ id, name: id, aliases: [], confederation })

const conmebol = ['br', 'ar', 'uy', 'co', 'cl', 'pe'].map((id) => m(id, 'CONMEBOL'))
const uefa = ['fr', 'de', 'es', 'it', 'pt'].map((id) => m(id, 'UEFA'))
const ofc = ['nz', 'fj'].map((id) => m(id, 'OFC'))
const all = [...conmebol, ...uefa, ...ofc]

describe('buildChoices', () => {
  it('devolve 4 opções distintas com a resposta e 3 da mesma confederação', () => {
    const choices = buildChoices(conmebol[0], all, createRng(1))
    expect(choices).toHaveLength(4)
    expect(new Set(choices.map((c) => c.id)).size).toBe(4)
    expect(choices.map((c) => c.id)).toContain('br')
    expect(choices.every((c) => c.confederation === 'CONMEBOL')).toBe(true)
  })

  it('completa com outras confederações quando faltam países', () => {
    const choices = buildChoices(ofc[0], all, createRng(2))
    const ids = choices.map((c) => c.id)
    expect(choices).toHaveLength(4)
    expect(new Set(ids).size).toBe(4)
    expect(ids).toContain('nz')
    expect(ids).toContain('fj')
    expect(choices.filter((c) => c.confederation !== 'OFC')).toHaveLength(2)
  })

  it('é determinístico pela semente', () => {
    expect(buildChoices(conmebol[0], all, createRng(5))).toEqual(buildChoices(conmebol[0], all, createRng(5)))
  })
})
