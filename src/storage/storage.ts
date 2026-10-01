import type { DailyRecord } from '@/game/daily'
import type { Square } from '@/game/round'

import { dailySchema, statsSchema } from './saveSchema'

export const STORAGE_KEY = 'flagx:v1'

export interface Stats {
  played: number
  streak: number
  maxStreak: number
  lastPuzzle: number | null
  totalPoints: number
  squares: Record<Square, number>
}

export interface SaveData {
  version: 1
  /** Desafio diário mais recente (em andamento ou concluído) */
  daily: DailyRecord | null
  stats: Stats
  freeBest: number
}

export function emptySave(): SaveData {
  return {
    version: 1,
    daily: null,
    stats: {
      played: 0,
      streak: 0,
      maxStreak: 0,
      lastPuzzle: null,
      totalPoints: 0,
      squares: { '🟩': 0, '🟨': 0, '🟧': 0, '🟥': 0 },
    },
    freeBest: 0,
  }
}

function browserStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function loadSave(storage: Storage | null = browserStorage()): SaveData {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return emptySave()
    const data = JSON.parse(raw) as Record<string, unknown> | null
    if (data?.version !== 1) return emptySave()

    // Estatísticas quebradas invalidam o save; um desafio quebrado é só descartado
    const stats = statsSchema.safeParse(data.stats)
    if (!stats.success) return emptySave()
    const daily = dailySchema.safeParse(data.daily)
    const freeBest = typeof data.freeBest === 'number' && data.freeBest >= 0 ? data.freeBest : 0

    return {
      version: 1,
      stats: stats.data as Stats,
      daily: daily.success ? (daily.data as DailyRecord) : null,
      freeBest,
    }
  } catch {
    return emptySave()
  }
}

export function writeSave(data: SaveData, storage: Storage | null = browserStorage()): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Sem storage (aba anônima, cota cheia): o jogo segue sem salvar
  }
}

export function recordDailyFinished(save: SaveData, puzzle: number, total: number, squares: Square[]): SaveData {
  const { stats } = save
  if (stats.lastPuzzle === puzzle) return save

  const streak = stats.lastPuzzle === puzzle - 1 ? stats.streak + 1 : 1
  const counts = { ...stats.squares }
  for (const square of squares) counts[square] += 1

  return {
    ...save,
    stats: {
      played: stats.played + 1,
      streak,
      maxStreak: Math.max(stats.maxStreak, streak),
      lastPuzzle: puzzle,
      totalPoints: stats.totalPoints + total,
      squares: counts,
    },
  }
}
