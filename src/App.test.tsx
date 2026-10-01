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
