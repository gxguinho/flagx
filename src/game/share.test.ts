import { describe, expect, it } from 'vitest'

import { buildShareText } from './share.ts'

const base = {
  puzzle: 42,
  mode: 'normal' as const,
  total: 3400,
  squares: ['🟩', '🟩', '🟨', '🟧', '🟥'] as const,
  url: 'https://flagx.vercel.app',
}

describe('buildShareText', () => {
  it('monta o placar do diário', () => {
    expect(buildShareText({ ...base, squares: [...base.squares] })).toBe(
      'flagx #42 · 3.400 pts\n🟩🟩🟨🟧🟥\nhttps://flagx.vercel.app',
    )
  })

  it('marca o modo fácil', () => {
    const text = buildShareText({ ...base, squares: [...base.squares], mode: 'facil', total: 1700 })
    expect(text.split('\n')[0]).toBe('flagx #42 · 1.700 pts (fácil)')
  })

  it('não usa separador abaixo de mil', () => {
    const text = buildShareText({ ...base, squares: [...base.squares], total: 800 })
    expect(text.split('\n')[0]).toBe('flagx #42 · 800 pts')
  })
})
