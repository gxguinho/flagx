import { shuffle, type Rng } from './rng.ts'
import type { Member } from './types.ts'

const CHOICE_COUNT = 4

/** Resposta + 3 distratores da mesma confederação (completando com outras se faltar), embaralhados */
export function buildChoices(answer: Member, members: readonly Member[], rng: Rng): Member[] {
  const others = members.filter((m) => m.id !== answer.id)
  const same = shuffle(rng, others.filter((m) => m.confederation === answer.confederation))
  const rest = shuffle(rng, others.filter((m) => m.confederation !== answer.confederation))
  const distractors = [...same, ...rest].slice(0, CHOICE_COUNT - 1)
  return shuffle(rng, [answer, ...distractors])
}
