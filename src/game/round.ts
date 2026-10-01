import { MAX_ATTEMPTS, scoreFor } from './scoring.ts'
import type { Hint, Mode } from './types.ts'

export type RoundStatus = 'playing' | 'won' | 'lost'
export type Square = '🟩' | '🟨' | '🟧' | '🟥'

/** Estado de uma rodada. É JSON puro: vai direto para o localStorage. */
export interface RoundState {
  countryId: string
  mode: Mode
  /** As 5 dicas sorteadas, níveis 1→5 */
  hints: Hint[]
  /** 4 ids no modo fácil; vazio no normal */
  choiceIds: string[]
  /** Palpites errados, em ordem */
  wrongIds: string[]
  status: RoundStatus
}

export type RoundAction = { type: 'guess'; memberId: string }

export function createRound(args: {
  countryId: string
  mode: Mode
  hints: Hint[]
  choiceIds?: string[]
}): RoundState {
  return {
    countryId: args.countryId,
    mode: args.mode,
    hints: args.hints,
    choiceIds: args.choiceIds ?? [],
    wrongIds: [],
    status: 'playing',
  }
}

export function roundReducer(state: RoundState, action: RoundAction): RoundState {
  const { memberId } = action
  if (state.status !== 'playing') return state
  if (state.wrongIds.includes(memberId)) return state
  if (state.mode === 'facil' && !state.choiceIds.includes(memberId)) return state

  if (memberId === state.countryId) return { ...state, status: 'won' }

  const wrongIds = [...state.wrongIds, memberId]
  const status = wrongIds.length >= MAX_ATTEMPTS[state.mode] ? 'lost' : 'playing'
  return { ...state, wrongIds, status }
}

export function revealedHints(state: RoundState): Hint[] {
  return state.hints.slice(0, Math.min(state.wrongIds.length, state.hints.length))
}

export function roundScore(state: RoundState): number {
  return state.status === 'won' ? scoreFor(state.mode, state.wrongIds.length + 1) : 0
}

export function squareFor(state: RoundState): Square {
  if (state.status === 'lost') return '🟥'
  const used = state.wrongIds.length
  if (used === 0) return '🟩'
  if (used <= 2) return '🟨'
  return '🟧'
}
