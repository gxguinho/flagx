import { describe, expect, it } from 'vitest'

import { createRng, hashString, pick, shuffle } from './rng'

const take = (rng: () => number, n: number) => Array.from({ length: n }, () => rng())

describe('createRng', () => {
  it('gera a mesma sequência para a mesma semente', () => {
    expect(take(createRng(42), 5)).toEqual(take(createRng(42), 5))
  })

  it('gera sequências diferentes para sementes diferentes', () => {
    expect(take(createRng(42), 5)).not.toEqual(take(createRng(43), 5))
  })

  it('gera valores em [0, 1)', () => {
    for (const v of take(createRng(7), 1000)) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('hashString', () => {
  it('é determinístico, distingue strings e não é negativo', () => {
    expect(hashString('flagx')).toBe(hashString('flagx'))
    expect(hashString('a')).not.toBe(hashString('b'))
    expect(Number.isInteger(hashString('flagx'))).toBe(true)
    expect(hashString('flagx')).toBeGreaterThanOrEqual(0)
  })
})

describe('shuffle', () => {
  it('mantém os elementos, não muta o original e é determinístico', () => {
    const original = [1, 2, 3, 4, 5]
    const a = shuffle(createRng(1), original)
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5])
    expect(original).toEqual([1, 2, 3, 4, 5])
    expect(shuffle(createRng(1), original)).toEqual(a)
  })
})

describe('pick', () => {
  it('sempre devolve um elemento do array', () => {
    const rng = createRng(3)
    const items = ['a', 'b', 'c']
    for (let i = 0; i < 100; i++) expect(items).toContain(pick(rng, items))
  })
})
