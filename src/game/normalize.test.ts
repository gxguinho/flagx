import { describe, expect, it } from 'vitest'

import { containsTerm, normalize, searchMembers } from './normalize'
import type { Member } from './types.ts'

const m = (id: string, name: string, aliases: string[] = []): Member => ({
  id,
  name,
  aliases,
  confederation: 'CAF',
})

const members: Member[] = [
  m('br', 'Brasil', ['brazil']),
  m('ci', 'Costa do Marfim', ["cote d'ivoire"]),
  m('st', 'São Tomé e Príncipe'),
  m('ba', 'Bósnia e Herzegovina'),
  m('gw', 'Guiné-Bissau'),
  m('gn', 'Guiné'),
  m('ir', 'Irã', ['ira', 'iran']),
  m('iq', 'Iraque'),
  m('nl', 'Países Baixos', ['holanda']),
  m('ar', 'Argentina'),
]

const names = (query: string) => searchMembers(query, members).map((x) => x.name)

describe('normalize', () => {
  it('remove acentos, pontuação e espaços extras', () => {
    expect(normalize('  São  Tomé ')).toBe('sao tome')
    expect(normalize('Guiné-Bissau')).toBe('guine bissau')
    expect(normalize("Côte d'Ivoire")).toBe('cote d ivoire')
  })
})

describe('searchMembers', () => {
  it('encontra nomes com acento, hífen e várias palavras', () => {
    expect(names('sao tome')[0]).toBe('São Tomé e Príncipe')
    expect(names('bosnia')).toContain('Bósnia e Herzegovina')
    expect(names('guine bissau')[0]).toBe('Guiné-Bissau')
  })

  it('encontra pelos aliases', () => {
    expect(names('cote')).toContain('Costa do Marfim')
    expect(names('holanda')).toContain('Países Baixos')
  })

  it('lista Irã antes de Iraque ao buscar "ira"', () => {
    const result = names('ira')
    expect(result).toContain('Iraque')
    expect(result[0]).toBe('Irã')
  })

  it('coloca o match exato antes do que só começa com o termo', () => {
    const result = names('guine')
    expect(result.indexOf('Guiné')).toBeLessThan(result.indexOf('Guiné-Bissau'))
  })

  it('devolve vazio para busca vazia', () => {
    expect(searchMembers('', members)).toEqual([])
    expect(searchMembers('   ', members)).toEqual([])
  })

  it('limita a 8 resultados', () => {
    const many = Array.from({ length: 20 }, (_, i) => m(`x${i}`, `Pais a${i}`))
    expect(searchMembers('a', many)).toHaveLength(8)
  })
})

describe('containsTerm', () => {
  it('usa substring para termos com 5 ou mais caracteres', () => {
    expect(containsTerm('O futebol brasileiro é famoso', 'Brasil')).toBe(true)
  })

  it('usa palavra inteira para termos curtos', () => {
    expect(containsTerm('Os peruanos jogam bem', 'eua')).toBe(false)
    expect(containsTerm('Os EUA sediaram a Copa', 'eua')).toBe(true)
  })
})
