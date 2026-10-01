import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('App', () => {
  it('mostra o nome do jogo, o slogan e o desafio do dia', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'flagx' })).toBeInTheDocument()
    expect(screen.getByText('Descubra o país através do futebol.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Desafio #\d+/ })).toBeInTheDocument()
  })

  it('abre o modo livre a partir do início', async () => {
    render(<App />)
    await userEvent.setup().click(screen.getByRole('button', { name: /Modo livre/ }))
    expect(screen.getByRole('heading', { name: 'Modo livre' })).toBeInTheDocument()
  })

  it('abre as estatísticas e volta ao início', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Estatísticas/ }))
    expect(screen.getByRole('heading', { name: 'Estatísticas' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(screen.getByRole('heading', { name: 'flagx' })).toBeInTheDocument()
  })

  it('abre o como jogar', async () => {
    render(<App />)
    await userEvent.setup().click(screen.getByRole('button', { name: /Como jogar/ }))
    expect(screen.getByRole('dialog', { name: 'Como jogar' })).toBeInTheDocument()
  })
})
