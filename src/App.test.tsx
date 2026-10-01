import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('App', () => {
  it('mostra o nome do jogo, o slogan e uma bandeira', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'flagx' })).toBeInTheDocument()
    expect(screen.getByText('Descubra o país através do futebol.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Bandeira' })).toHaveClass('fi-br')
  })
})

describe('App — navegação', () => {
  it('abre o modo livre a partir do início', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    render(<App />)
    await userEvent.setup().click(screen.getByRole('button', { name: /Modo livre/ }))
    expect(screen.getByRole('heading', { name: 'Modo livre' })).toBeInTheDocument()
  })
})
