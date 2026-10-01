import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createDailyRun, type DailyRecord } from '@/game/daily'
import { roundReducer } from '@/game/round'
import { emptySave } from '@/storage/storage'
import { testCountries, testMembers } from '@/test/fixtures'

import { dailyStatus, type DailyStatus } from './dailyStatus'
import { Home } from './Home'

const solve = (record: DailyRecord, upTo: number): DailyRecord => ({
  ...record,
  rounds: record.rounds.map((r, i) => (i < upTo ? roundReducer(r, { type: 'guess', memberId: r.countryId }) : r)),
})

describe('dailyStatus', () => {
  const run = createDailyRun(3, 'normal', testCountries, testMembers)

  it('é "novo" sem desafio salvo ou com desafio de outro dia', () => {
    expect(dailyStatus(emptySave(), 3)).toBe('novo')
    expect(dailyStatus({ ...emptySave(), daily: run }, 4)).toBe('novo')
  })

  it('é "andamento" com rodadas pendentes', () => {
    expect(dailyStatus({ ...emptySave(), daily: solve(run, 2) }, 3)).toBe('andamento')
  })

  it('é "concluido" com tudo terminado', () => {
    expect(dailyStatus({ ...emptySave(), daily: solve(run, 5) }, 3)).toBe('concluido')
  })
})

describe('Home', () => {
  const noop = () => {}
  const renderHome = (status: DailyStatus) =>
    render(<Home puzzle={12} status={status} onDaily={noop} onFree={noop} onStats={noop} onHelp={noop} />)

  it.each([
    ['novo', 'Jogar'],
    ['andamento', 'Continuar'],
    ['concluido', 'Ver resultado'],
  ] as const)('mostra o desafio com o rótulo certo (%s)', (status, label) => {
    renderHome(status)
    const button = screen.getByRole('button', { name: /Desafio #12/ })
    expect(button).toHaveTextContent(label)
  })
})
