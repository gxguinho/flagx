import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { createDailyRun, type DailyRecord } from '@/game/daily'
import { roundReducer } from '@/game/round'
import type { UpdateSave } from '@/state/useSave'
import { emptySave, type SaveData } from '@/storage/storage'
import { countriesModule, shownCountryId, testCountries, testMembers } from '@/test/fixtures'

import { DailyScreen } from './DailyScreen'

vi.mock('@/data/countries', async () => (await import('@/test/fixtures')).countriesModule)

// 2026-10-07 em Brasília → desafio #7
const now = () => new Date('2026-10-07T15:00:00Z')
const PUZZLE = 7

function Harness({ initial, onUpdate }: { initial: SaveData; onUpdate: (s: SaveData) => void }) {
  const [save, setSave] = useState(initial)
  const updateSave: UpdateSave = (fn) =>
    setSave((prev) => {
      const next = fn(prev)
      onUpdate(next)
      return next
    })
  return <DailyScreen save={save} updateSave={updateSave} now={now} onBack={() => {}} />
}

function setup(initial: SaveData = emptySave()) {
  const onUpdate = vi.fn()
  render(<Harness initial={initial} onUpdate={onUpdate} />)
  return { onUpdate, user: userEvent.setup(), last: () => onUpdate.mock.calls.at(-1)![0] as SaveData }
}

const solved = (record: DailyRecord, upTo: number): DailyRecord => ({
  ...record,
  rounds: record.rounds.map((r, i) => (i < upTo ? roundReducer(r, { type: 'guess', memberId: r.countryId }) : r)),
})

describe('DailyScreen', () => {
  it('pede o nível e cria o desafio do dia', async () => {
    const { user, last } = setup()
    expect(screen.getByText(`Desafio #${PUZZLE}`)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Fácil' }))
    expect(last().daily).toMatchObject({ puzzle: PUZZLE, mode: 'facil' })
    expect(last().daily!.rounds).toHaveLength(5)
    expect(screen.getByText(/1\/5/)).toBeInTheDocument()
  })

  it('retoma o desafio em andamento', () => {
    const record = solved(createDailyRun(PUZZLE, 'normal', testCountries, testMembers), 1)
    setup({ ...emptySave(), daily: record })
    expect(screen.getByText(/2\/5/)).toBeInTheDocument()
  })

  it('ignora o desafio salvo de outro dia', () => {
    const old = createDailyRun(PUZZLE - 1, 'normal', testCountries, testMembers)
    setup({ ...emptySave(), daily: old })
    expect(screen.getByRole('button', { name: 'Normal' })).toBeInTheDocument()
  })

  it('registra as estatísticas e vai direto ao resumo ao acertar a última', async () => {
    const record = solved(createDailyRun(PUZZLE, 'normal', testCountries, testMembers), 4)
    const { user, last } = setup({ ...emptySave(), daily: record })
    const answer = shownCountryId(screen.getByRole('img', { name: 'Bandeira' }))
    const name = countriesModule.getMember(answer).name
    await user.type(screen.getByPlaceholderText('Digite o país...'), name)
    await user.click(screen.getByRole('option', { name }))

    expect(last().stats).toMatchObject({ played: 1, lastPuzzle: PUZZLE, totalPoints: 5000 })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('5.000 pts')).toBeInTheDocument()
    expect(screen.getByText('🟩🟩🟩🟩🟩')).toBeInTheDocument()
  })
})
