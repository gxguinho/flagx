import { describe, expect, it } from 'vitest'

import { countries, getCountry, getMember, members } from './countries'

describe('dados carregados', () => {
  it('traz os 211 membros em ordem alfabética e os países jogáveis', () => {
    expect(members).toHaveLength(211)
    expect(members[0].name.localeCompare(members[1].name, 'pt-BR')).toBeLessThan(0)
    expect(countries.length).toBeGreaterThanOrEqual(32)
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
