import type { Country, CountryContent, Member } from '@/game/types'

import membersJson from '../../data/members.json'

// Dados já validados no build (scripts/validate.ts): sem validação em runtime
const contents = Object.values(
  import.meta.glob<CountryContent>('../../data/countries/*.json', { eager: true, import: 'default' }),
)

export const members: Member[] = (membersJson as Member[])
  .slice()
  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

const memberById = new Map(members.map((m) => [m.id, m]))

export const countries: Country[] = contents.map((content) => ({ ...getMember(content.id), ...content }))

const countryById = new Map(countries.map((c) => [c.id, c]))

export function getMember(id: string): Member {
  const member = memberById.get(id)
  if (!member) throw new Error(`Membro desconhecido: ${id}`)
  return member
}

export function getCountry(id: string): Country {
  const country = countryById.get(id)
  if (!country) throw new Error(`País sem conteúdo: ${id}`)
  return country
}
