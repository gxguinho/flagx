import { currentRoundIndex } from '@/game/daily'
import type { SaveData } from '@/storage/storage'

export type DailyStatus = 'novo' | 'andamento' | 'concluido'

export function dailyStatus(save: SaveData, puzzle: number): DailyStatus {
  if (save.daily?.puzzle !== puzzle) return 'novo'
  return currentRoundIndex(save.daily) === -1 ? 'concluido' : 'andamento'
}
