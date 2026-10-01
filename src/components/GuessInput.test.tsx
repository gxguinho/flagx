import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Member } from '@/game/types'

import { GuessInput } from './GuessInput'

const members: Member[] = [
  { id: 'ar', name: 'Argentina', aliases: [], confederation: 'CONMEBOL' },
  { id: 'br', name: 'Brasil', aliases: ['brazil'], confederation: 'CONMEBOL' },
  { id: 'uy', name: 'Uruguai', aliases: [], confederation: 'CONMEBOL' },
  { id: 'fr', name: 'França', aliases: [], confederation: 'UEFA' },
]

function setup(excludedIds: string[] = []) {
  const onGuess = vi.fn()
  render(<GuessInput members={members} excludedIds={excludedIds} onGuess={onGuess} />)
  return { onGuess, input: screen.getByPlaceholderText('Digite o país...'), user: userEvent.setup() }
}

describe('GuessInput', () => {
  it('não mostra opções antes de digitar', () => {
    setup()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  it('escolhe um país clicando na opção e limpa o campo', async () => {
    const { onGuess, input, user } = setup()
    await user.type(input, 'arg')
    await user.click(screen.getByRole('option', { name: 'Argentina' }))
    expect(onGuess).toHaveBeenCalledWith('ar')
    expect(input).toHaveValue('')
  })

  it('escolhe o primeiro resultado com Enter', async () => {
    const { onGuess, input, user } = setup()
    await user.type(input, 'bra{Enter}')
    expect(onGuess).toHaveBeenCalledWith('br')
  })

  it('mostra países já chutados riscados e não deixa escolher de novo', async () => {
    const { onGuess, input, user } = setup(['uy'])
    await user.type(input, 'uru')
    const option = screen.getByRole('option', { name: 'Uruguai' })
    expect(option).toHaveClass('line-through')
    expect(option).toHaveAttribute('aria-disabled', 'true')
    await user.click(option)
    expect(onGuess).not.toHaveBeenCalled()
  })

  it('avisa quando nada é encontrado', async () => {
    const { input, user } = setup()
    await user.type(input, 'zzz')
    expect(screen.getByText('Nenhum país encontrado')).toBeInTheDocument()
  })
})
