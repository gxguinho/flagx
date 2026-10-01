import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { emptySave, type SaveData } from '@/storage/storage'

import { StatsScreen } from './StatsScreen'

describe('StatsScreen', () => {
  it('mostra os números salvos', () => {
    const save: SaveData = {
      ...emptySave(),
      freeBest: 4200,
      stats: {
        played: 4,
        streak: 2,
        maxStreak: 3,
        lastPuzzle: 9,
        totalPoints: 10000,
        squares: { '🟩': 7, '🟨': 6, '🟧': 5, '🟥': 2 },
      },
    }
    render(<StatsScreen save={save} onBack={() => {}} />)

    const value = (label: string) => screen.getByText(label).closest('[data-stat]')!
    expect(value('Desafios jogados')).toHaveTextContent('4')
    expect(value('Média de pontos')).toHaveTextContent('2.500')
    expect(value('Sequência atual')).toHaveTextContent('2')
    expect(value('Melhor sequência')).toHaveTextContent('3')
    expect(value('Recorde no modo livre')).toHaveTextContent('4.200')
    expect(screen.getByTestId('square-🟩')).toHaveTextContent('7')
    expect(screen.getByTestId('square-🟨')).toHaveTextContent('6')
    expect(screen.getByTestId('square-🟧')).toHaveTextContent('5')
    expect(screen.getByTestId('square-🟥')).toHaveTextContent('2')
  })

  it('mostra média zero sem jogos', () => {
    render(<StatsScreen save={emptySave()} onBack={() => {}} />)
    expect(screen.getByText('Média de pontos').closest('[data-stat]')).toHaveTextContent('0')
  })
})
