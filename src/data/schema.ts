import { z } from 'zod'

const level = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])

export const memberSchema = z.object({
  id: z.string().regex(/^[a-z]{2}(-[a-z]{3})?$/),
  name: z.string().min(1),
  aliases: z.array(z.string().min(1)),
  confederation: z.enum(['CONMEBOL', 'UEFA', 'CAF', 'AFC', 'CONCACAF', 'OFC']),
})

export const membersSchema = z.array(memberSchema)

export const hintSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  category: z.enum(['jogador', 'titulo', 'copa', 'clube', 'rivalidade', 'confederacao', 'momento', 'curiosidade']),
  level,
  reviewed: z.boolean(),
})

export const countryContentSchema = z.object({
  id: z.string(),
  flagDifficulty: level,
  hints: z.array(hintSchema),
})
