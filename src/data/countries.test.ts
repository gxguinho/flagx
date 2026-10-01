import { describe, expect, it } from 'vitest'

import { countries, getCountry, getMember, members } from './countries'

describe('dados carregados', () => {
  it('traz as 240 bandeiras em ordem alfabética, todas jogáveis', () => {
    expect(members).toHaveLength(240)
    expect(members[0].name.localeCompare(members[1].name, 'pt-BR')).toBeLessThan(0)
    expect(countries).toHaveLength(members.length)
  })

  it('junta metadados e conteúdo de um país', () => {
    const br = getCountry('br')
    expect(br.name).toBe('Brasil')
    expect(br.hints.length).toBeGreaterThanOrEqual(8)
    expect(getMember('xk').name).toBe('Kosovo')
  })

  it('lança erro para id desconhecido', () => {
    expect(() => getCountry('zz')).toThrow()
    expect(() => getMember('zz')).toThrow()
  })
})

describe('faixas do desafio diário', () => {
  it('têm pelo menos 5 países cada, para a mesma bandeira não voltar a cada poucos dias', () => {
    for (const d of [1, 2, 3, 4, 5]) {
      expect(countries.filter((c) => c.flagDifficulty === d).length, `faixa ${d}`).toBeGreaterThanOrEqual(5)
    }
  })
})
