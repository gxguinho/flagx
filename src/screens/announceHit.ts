import { toast } from 'sonner'

import { getMember } from '@/data/countries'
import { roundScore, type RoundState } from '@/game/round'

/** Aviso rápido de acerto: o jogo segue direto para a próxima bandeira */
export function announceHit(round: RoundState) {
  toast(`✅ ${getMember(round.countryId).name} +${roundScore(round)}`, { duration: 1500 })
}
