// Importado por scripts/validate.ts (Node puro): imports relativos com .ts, sem o alias @/
import { containsTerm, normalize } from '../game/normalize.ts'
import type { CountryContent, Level, Member } from '../game/types.ts'
import { countryContentSchema, membersSchema } from './schema.ts'

const LEVELS: Level[] = [1, 2, 3, 4, 5]
const MIN_HINTS = 8
const MAX_HINTS = 12
/** Geografia é último recurso: só nas dicas mais reveladoras */
const MIN_GEOGRAPHY_LEVEL = 4

const issues = (e: { issues: { path: PropertyKey[]; message: string }[] }) =>
  e.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')

/** Valida o registro de membros e o conteúdo dos países. Devolve a lista de erros ([] = válido). */
export function validateDataset(input: {
  members: unknown
  contents: Record<string, unknown>
  flagExists: (id: string) => boolean
}): string[] {
  const errors: string[] = []

  const parsedMembers = membersSchema.safeParse(input.members)
  if (!parsedMembers.success) return [`members.json inválido — ${issues(parsedMembers.error)}`]
  const members = parsedMembers.data as Member[]

  const byId = new Map<string, Member>()
  const termOwner = new Map<string, string>()
  for (const member of members) {
    if (byId.has(member.id)) errors.push(`membro duplicado: ${member.id}`)
    byId.set(member.id, member)
    if (!input.flagExists(member.id)) errors.push(`${member.id}: bandeira não encontrada no flag-icons`)
    for (const term of [member.name, ...member.aliases]) {
      const key = normalize(term)
      const owner = termOwner.get(key)
      if (owner && owner !== member.id) errors.push(`nome/alias "${key}" usado por ${owner} e ${member.id}`)
      termOwner.set(key, member.id)
    }
  }

  const hintIds = new Set<string>()
  const difficulties = new Set<Level>()

  for (const [file, raw] of Object.entries(input.contents)) {
    const parsed = countryContentSchema.safeParse(raw)
    if (!parsed.success) {
      errors.push(`${file}.json inválido — ${issues(parsed.error)}`)
      continue
    }
    const content = parsed.data as CountryContent
    const { id, hints } = content

    if (id !== file) errors.push(`${file}.json tem id "${id}"`)
    const member = byId.get(id)
    if (!member) {
      errors.push(`${file}.json: "${id}" não é membro`)
      continue
    }
    difficulties.add(content.flagDifficulty)

    if (hints.length < MIN_HINTS || hints.length > MAX_HINTS) {
      errors.push(`${id}: ${hints.length} dicas (esperado ${MIN_HINTS}–${MAX_HINTS})`)
    }
    for (const level of LEVELS) {
      if (!hints.some((h) => h.level === level)) errors.push(`${id}: sem dica de nível ${level}`)
    }

    const idPattern = new RegExp(`^${id}-[0-9]{2}$`)
    for (const hint of hints) {
      if (!idPattern.test(hint.id)) errors.push(`${id}: id de dica fora do padrão: ${hint.id}`)
      if (hintIds.has(hint.id)) errors.push(`${id}: id de dica repetido: ${hint.id}`)
      hintIds.add(hint.id)
      const leaked = [member.name, ...member.aliases].find((term) => containsTerm(hint.text, term))
      if (leaked) errors.push(`${hint.id}: o texto menciona "${leaked}"`)
      if (hint.category === 'geografia' && hint.level < MIN_GEOGRAPHY_LEVEL) {
        errors.push(`${hint.id}: dica de geografia no nível ${hint.level} (mínimo ${MIN_GEOGRAPHY_LEVEL})`)
      }
    }
  }

  for (const member of members) {
    if (!(member.id in input.contents)) errors.push(`${member.id}: membro sem dicas (data/countries/${member.id}.json)`)
  }

  for (const level of LEVELS) {
    if (!difficulties.has(level)) errors.push(`nenhum país com flagDifficulty ${level}`)
  }

  return errors
}
