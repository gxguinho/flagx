import { describe, expect, it } from 'vitest'

import { MAX_ATTEMPTS, scoreFor } from './scoring.ts'

describe('scoreFor', () => {
  it('segue a tabela do modo normal', () => {
    expect([1, 2, 3, 4, 5, 6].map((n) => scoreFor('normal', n))).toEqual([1000, 800, 600, 400, 250, 100])
    expect(scoreFor('normal', null)).toBe(0)
  })

  it('segue a tabela do modo fácil', () => {
    expect([1, 2, 3, 4].map((n) => scoreFor('facil', n))).toEqual([500, 400, 300, 200])
    expect(scoreFor('facil', null)).toBe(0)
  })

  it('define o máximo de tentativas por modo', () => {
    expect(MAX_ATTEMPTS).toEqual({ normal: 6, facil: 4 })
  })
})
