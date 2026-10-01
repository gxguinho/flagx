import { describe, expect, it } from 'vitest'

import type { CountryContent, HintCategory, Member } from '../game/types.ts'
import { validateDataset } from './validate.ts'

const CATEGORIES: HintCategory[] = ['jogador', 'titulo', 'copa', 'clube', 'rivalidade', 'confederacao', 'momento', 'curiosidade']

const IDS = ['br', 'ar', 'fr', 'jp', 'sm'] as const
const NAMES: Record<string, string> = { br: 'Brasil', ar: 'Argentina', fr: 'França', jp: 'Japão', sm: 'San Marino' }

function fixture() {
  const members: Member[] = IDS.map((id) => ({
    id,
    name: NAMES[id],
    aliases: [`alias${id}`],
    confederation: 'UEFA',
  }))
  const contents: Record<string, CountryContent> = {}
  IDS.forEach((id, i) => {
    contents[id] = {
      id,
      flagDifficulty: (i + 1) as CountryContent['flagDifficulty'],
      hints: Array.from({ length: 8 }, (_, n) => ({
        id: `${id}-${String(n + 1).padStart(2, '0')}`,
        text: `Uma dica neutra número ${n + 1}.`,
        category: CATEGORIES[n],
        level: ((n % 5) + 1) as 1 | 2 | 3 | 4 | 5,
        reviewed: false,
      })),
    }
  })
  return { members, contents, flagExists: (_id: string) => true }
}

const errorsOf = (mutate: (f: ReturnType<typeof fixture>) => void) => {
  const f = fixture()
  mutate(f)
  return validateDataset(f).join('\n')
}

describe('validateDataset', () => {
  it('aceita um conjunto válido', () => {
    expect(validateDataset(fixture())).toEqual([])
  })

  it('rejeita membro duplicado', () => {
    expect(errorsOf((f) => f.members.push({ ...f.members[0], name: 'Outro' }))).toMatch(/br/)
  })

  it('rejeita alias igual ao nome de outro membro', () => {
    expect(errorsOf((f) => f.members[1].aliases.push('brasil'))).toMatch(/brasil/)
  })

  it('rejeita arquivo cujo id não bate com o nome do arquivo', () => {
    expect(errorsOf((f) => (f.contents.ar = { ...f.contents.ar, id: 'br' }))).toMatch(/ar/)
  })

  it('rejeita conteúdo de país que não é membro', () => {
    expect(errorsOf((f) => (f.contents.zz = { ...f.contents.br, id: 'zz', hints: f.contents.br.hints.map((h) => ({ ...h, id: h.id.replace('br', 'zz') })) }))).toMatch(/zz/)
  })

  it('exige entre 8 e 12 dicas', () => {
    expect(errorsOf((f) => f.contents.br.hints.pop())).toMatch(/br/)
    expect(
      errorsOf((f) => {
        for (let n = 9; n <= 13; n++) f.contents.br.hints.push({ ...f.contents.br.hints[0], id: `br-${n}` })
      }),
    ).toMatch(/br/)
  })

  it('exige pelo menos uma dica de cada nível', () => {
    expect(errorsOf((f) => f.contents.br.hints.forEach((h) => h.level === 3 && (h.level = 2)))).toMatch(/br.*3|3.*br/)
  })

  it('rejeita dica que menciona o país', () => {
    expect(errorsOf((f) => (f.contents.br.hints[0].text = 'O futebol brasileiro é famoso.'))).toMatch(/br-01/)
  })

  it('rejeita id de dica repetido ou fora do padrão', () => {
    expect(errorsOf((f) => (f.contents.br.hints[1].id = 'br-01'))).toMatch(/br-01/)
    expect(errorsOf((f) => (f.contents.br.hints[1].id = 'x-1'))).toMatch(/x-1/)
  })

  it('rejeita membro sem bandeira', () => {
    expect(errorsOf((f) => (f.flagExists = (id) => id !== 'jp'))).toMatch(/jp/)
  })

  it('exige pelo menos um país em cada faixa de dificuldade', () => {
    expect(errorsOf((f) => (f.contents.sm.flagDifficulty = 4))).toMatch(/5/)
  })

  it('rejeita schema inválido', () => {
    expect(errorsOf((f) => ((f.contents.br.hints[0] as { level: number }).level = 7))).toMatch(/br/)
    expect(errorsOf((f) => ((f.contents.br.hints[0] as { category: string }).category = 'estadio'))).toMatch(/br/)
  })

  it('aceita membro sem confederação e categorias além do futebol', () => {
    expect(
      errorsOf((f) => {
        f.members[4] = { ...f.members[4], confederation: null }
        f.contents.br.hints[0].category = 'esporte'
        f.contents.br.hints[1].category = 'cultura'
        f.contents.br.hints[2].category = 'historia'
      }),
    ).toBe('')
  })

  it('só aceita dica de geografia nos níveis 4 e 5', () => {
    expect(errorsOf((f) => (f.contents.br.hints[0].category = 'geografia'))).toMatch(/br-01/)
    expect(errorsOf((f) => (f.contents.br.hints[3].category = 'geografia'))).toBe('')
  })

  it('exige dicas para todo membro', () => {
    expect(errorsOf((f) => f.members.push({ id: 'mc', name: 'Mônaco', aliases: [], confederation: null }))).toMatch(/mc/)
  })

  it('aceita ids de subdivisão com duas letras', () => {
    expect(
      errorsOf((f) => {
        f.members.push({ id: 'sh-hl', name: 'Santa Helena', aliases: [], confederation: null })
        f.contents['sh-hl'] = { ...f.contents.sm, id: 'sh-hl', hints: f.contents.sm.hints.map((h) => ({ ...h, id: h.id.replace('sm', 'sh-hl') })) }
      }),
    ).toBe('')
  })
})
