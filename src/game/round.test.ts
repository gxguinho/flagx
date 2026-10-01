import { describe, expect, it } from 'vitest'

import { createRound, revealedHints, roundReducer, roundScore, squareFor, type RoundState } from './round.ts'
import type { Hint, Level } from './types.ts'

const hints: Hint[] = ([1, 2, 3, 4, 5] as Level[]).map((level) => ({
  id: `br-0${level}`,
  text: `dica ${level}`,
  level,
  category: 'jogador',
  reviewed: false,
}))

const guess = (state: RoundState, ...ids: string[]) =>
  ids.reduce((s, memberId) => roundReducer(s, { type: 'guess', memberId }), state)

const normal = () => createRound({ countryId: 'br', mode: 'normal', hints })
const facil = () => createRound({ countryId: 'br', mode: 'facil', hints, choiceIds: ['br', 'ar', 'uy', 'co'] })

describe('roundReducer', () => {
  it('acerto de primeira vale 1000 e 🟩, sem dicas', () => {
    const s = guess(normal(), 'br')
    expect(s.status).toBe('won')
    expect(roundScore(s)).toBe(1000)
    expect(squareFor(s)).toBe('🟩')
    expect(revealedHints(s)).toEqual([])
  })

  it('dois erros e acerto revelam 2 dicas e valem 600 e 🟨', () => {
    const s = guess(normal(), 'ar', 'uy', 'br')
    expect(s.wrongIds).toEqual(['ar', 'uy'])
    expect(revealedHints(s).map((h) => h.level)).toEqual([1, 2])
    expect(roundScore(s)).toBe(600)
    expect(squareFor(s)).toBe('🟨')
  })

  it('seis erros no normal perdem a rodada', () => {
    const s = guess(normal(), 'a1', 'a2', 'a3', 'a4', 'a5', 'a6')
    expect(s.status).toBe('lost')
    expect(roundScore(s)).toBe(0)
    expect(squareFor(s)).toBe('🟥')
    expect(revealedHints(s)).toHaveLength(5)
  })

  it('ignora palpite repetido', () => {
    const s = guess(normal(), 'ar')
    expect(roundReducer(s, { type: 'guess', memberId: 'ar' })).toBe(s)
  })

  it('ignora palpite depois do fim da rodada', () => {
    const won = guess(normal(), 'br')
    expect(roundReducer(won, { type: 'guess', memberId: 'ar' })).toBe(won)
    const lost = guess(normal(), 'a1', 'a2', 'a3', 'a4', 'a5', 'a6')
    expect(roundReducer(lost, { type: 'guess', memberId: 'br' })).toBe(lost)
  })

  it('no fácil ignora palpite fora das opções e pontua 200 com três erros', () => {
    const start = facil()
    expect(roundReducer(start, { type: 'guess', memberId: 'fr' })).toBe(start)
    const s = guess(start, 'ar', 'uy', 'co', 'br')
    expect(s.status).toBe('won')
    expect(roundScore(s)).toBe(200)
    expect(squareFor(s)).toBe('🟧')
  })

  it('continua funcionando depois de serializado em JSON', () => {
    const s = JSON.parse(JSON.stringify(guess(normal(), 'ar'))) as RoundState
    const next = guess(s, 'br')
    expect(next.status).toBe('won')
    expect(roundScore(next)).toBe(800)
  })
})
