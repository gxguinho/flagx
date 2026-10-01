import * as z from 'zod/mini'

// Formato do que fica no localStorage. Usado só para descartar dados quebrados ao carregar.

const count = z.number().check(z.int(), z.nonnegative())
const mode = z.enum(['normal', 'facil'])

const hintSchema = z.object({
  id: z.string(),
  text: z.string(),
  category: z.enum([
      'jogador',
      'titulo',
      'copa',
      'clube',
      'rivalidade',
      'confederacao',
      'momento',
      'curiosidade',
      'esporte',
      'cultura',
      'historia',
      'geografia',
    ]),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  reviewed: z.boolean(),
})

const roundSchema = z.object({
  countryId: z.string(),
  mode,
  hints: z.array(hintSchema),
  choiceIds: z.array(z.string()),
  wrongIds: z.array(z.string()),
  status: z.enum(['playing', 'won', 'lost']),
})

export const dailySchema = z.object({
  puzzle: count,
  mode,
  rounds: z.array(roundSchema).check(z.minLength(1)),
})

export const statsSchema = z.object({
  played: count,
  streak: count,
  maxStreak: count,
  lastPuzzle: z.nullable(z.number()),
  totalPoints: count,
  squares: z.object({ '🟩': count, '🟨': count, '🟧': count, '🟥': count }),
})
