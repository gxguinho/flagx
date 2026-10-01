import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { emptySave, type SaveData } from '@/storage/storage'
import { countriesModule, shownCountryId, testMembers } from '@/test/fixtures'

import { FreeScreen } from './FreeScreen'

vi.mock('@/data/countries', async () => (await import('@/test/fixtures')).countriesModule)
vi.mock('@/game/rng', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/game/rng')>()),
  randomSeed: () => 1,
}))

const nameOf = (id: string) => countriesModule.getMember(id).name

function setup(save: SaveData = emptySave()) {
  const updateSave = vi.fn()
  render(<FreeScreen save={save} updateSave={updateSave} onBack={() => {}} />)
  return { updateSave, user: userEvent.setup() }
}

async function guess(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.type(screen.getByPlaceholderText('Digite o país...'), name)
  await user.click(screen.getByRole('option', { name }))
}

describe('FreeScreen', () => {
  it('revela uma dica a cada erro', async () => {
    const { user } = setup()
    const answer = shownCountryId(screen.getByRole('img', { name: 'Bandeira' }))
    const wrong = testMembers.find((m) => m.id !== answer)!
    await guess(user, wrong.name)
    expect(screen.getByText('Dica 1')).toBeInTheDocument()
  })

  it('ao acertar, vai direto para a próxima bandeira e soma os pontos', async () => {
    const { user } = setup()
    const answer = shownCountryId(screen.getByRole('img', { name: 'Bandeira' }))
    const wrong = testMembers.find((m) => m.id !== answer)!
    await guess(user, wrong.name)
    await guess(user, nameOf(answer))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(shownCountryId(screen.getByRole('img', { name: 'Bandeira' }))).not.toBe(answer)
    expect(screen.queryByText('Dica 1')).not.toBeInTheDocument()
    expect(screen.getByTestId('session-score')).toHaveTextContent('800')
  })

  it('atualiza o recorde quando a sessão passa dele', async () => {
    const { user, updateSave } = setup({ ...emptySave(), freeBest: 500 })
    const answer = shownCountryId(screen.getByRole('img', { name: 'Bandeira' }))
    await guess(user, nameOf(answer))
    expect(updateSave).toHaveBeenCalled()
    const apply = updateSave.mock.calls.at(-1)![0] as (s: SaveData) => SaveData
    expect(apply({ ...emptySave(), freeBest: 500 }).freeBest).toBe(1000)
  })
})
