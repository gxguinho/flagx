import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createRound, roundReducer, type RoundState } from '@/game/round'
import { testCountries } from '@/test/fixtures'

import { RoundView } from './RoundView'

vi.mock('@/data/countries', async () => (await import('@/test/fixtures')).countriesModule)

const country = testCountries[1]
const base = createRound({ countryId: country.id, mode: 'normal', hints: country.hints.filter((_, i) => i % 2 === 0) })
const play = (...ids: string[]) =>
  ids.reduce((s: RoundState, memberId) => roundReducer(s, { type: 'guess', memberId }), base)

const renderRound = (round: RoundState) =>
  render(<RoundView round={round} header={null} onGuess={() => {}} onNext={() => {}} nextLabel="Próxima" />)

describe('RoundView', () => {
  it('não abre diálogo quando o jogador acerta', () => {
    renderRound(play(country.id))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('mostra a resposta e as dicas quando o jogador erra tudo', () => {
    // Estado de derrota montado à mão: as fixtures só têm 5 países para chutar
    const others = testCountries.filter((c) => c.id !== country.id).map((c) => c.id)
    renderRound({ ...base, wrongIds: others, status: 'lost' })
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Não foi dessa vez')).toBeInTheDocument()
    expect(within(dialog).getByText(country.name)).toBeInTheDocument()
    expect(within(dialog).getAllByText(/^Dica \d$/)).toHaveLength(5)
    expect(within(dialog).getByRole('button', { name: 'Próxima' })).toBeInTheDocument()
  })
})
