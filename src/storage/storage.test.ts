import { describe, expect, it } from 'vitest'

import { emptySave, loadSave, recordDailyFinished, STORAGE_KEY, writeSave, type SaveData } from './storage.ts'

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial))
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  }
}

const throwing: Storage = {
  length: 0,
  clear() {},
  key: () => null,
  removeItem() {},
  getItem() {
    throw new Error('bloqueado')
  },
  setItem() {
    throw new Error('bloqueado')
  },
}

describe('loadSave / writeSave', () => {
  it('começa vazio', () => {
    expect(loadSave(memoryStorage())).toEqual(emptySave())
  })

  it('lê de volta o que gravou', () => {
    const storage = memoryStorage()
    const save: SaveData = { ...emptySave(), freeBest: 4200 }
    writeSave(save, storage)
    expect(loadSave(storage)).toEqual(save)
  })

  it('descarta dado corrompido ou de outra versão', () => {
    expect(loadSave(memoryStorage({ [STORAGE_KEY]: '{quebrado' }))).toEqual(emptySave())
    expect(loadSave(memoryStorage({ [STORAGE_KEY]: JSON.stringify({ version: 0 }) }))).toEqual(emptySave())
  })

  it('não quebra quando o storage lança exceção ou não existe', () => {
    expect(loadSave(throwing)).toEqual(emptySave())
    expect(() => writeSave(emptySave(), throwing)).not.toThrow()
    expect(loadSave(null)).toEqual(emptySave())
  })
})

describe('recordDailyFinished', () => {
  const withStats = (stats: Partial<SaveData['stats']>): SaveData => ({
    ...emptySave(),
    stats: { ...emptySave().stats, ...stats },
  })

  it('continua a sequência a partir do dia anterior', () => {
    const save = withStats({ played: 3, lastPuzzle: 4, streak: 2, maxStreak: 2, totalPoints: 1000 })
    const next = recordDailyFinished(save, 5, 3400, ['🟩', '🟩', '🟨', '🟧', '🟥'])
    expect(next.stats).toMatchObject({ played: 4, streak: 3, maxStreak: 3, lastPuzzle: 5, totalPoints: 4400 })
    expect(next.stats.squares).toEqual({ '🟩': 2, '🟨': 1, '🟧': 1, '🟥': 1 })
  })

  it('reinicia a sequência quando pulou dias', () => {
    const save = withStats({ played: 3, lastPuzzle: 2, streak: 2, maxStreak: 2 })
    expect(recordDailyFinished(save, 5, 0, []).stats).toMatchObject({ streak: 1, maxStreak: 2 })
  })

  it('não conta o mesmo desafio duas vezes', () => {
    const once = recordDailyFinished(emptySave(), 5, 1000, ['🟩'])
    expect(recordDailyFinished(once, 5, 1000, ['🟩'])).toBe(once)
  })
})
