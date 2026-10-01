import type { Country, Hint, Level, Member } from '@/game/types'

const LEVELS: Level[] = [1, 2, 3, 4, 5]

function makeCountry(member: Member, flagDifficulty: Level): Country {
  return {
    ...member,
    flagDifficulty,
    hints: LEVELS.flatMap((level): Hint[] => [
      { id: `${member.id}-${level}a`, text: `${member.id} dica nível ${level} A`, level, category: 'jogador', reviewed: false },
      { id: `${member.id}-${level}b`, text: `${member.id} dica nível ${level} B`, level, category: 'clube', reviewed: false },
    ]),
  }
}

export const testMembers: Member[] = [
  { id: 'ar', name: 'Argentina', aliases: [], confederation: 'CONMEBOL' },
  { id: 'br', name: 'Brasil', aliases: [], confederation: 'CONMEBOL' },
  { id: 'cl', name: 'Chile', aliases: [], confederation: 'CONMEBOL' },
  { id: 'uy', name: 'Uruguai', aliases: [], confederation: 'CONMEBOL' },
  { id: 'fr', name: 'França', aliases: [], confederation: 'UEFA' },
]

/** Um país jogável por faixa de dificuldade */
export const testCountries: Country[] = testMembers.map((m, i) => makeCountry(m, (i + 1) as Level))

export const countriesModule = {
  members: testMembers,
  countries: testCountries,
  getMember: (id: string) => {
    const m = testMembers.find((x) => x.id === id)
    if (!m) throw new Error(id)
    return m
  },
  getCountry: (id: string) => {
    const c = testCountries.find((x) => x.id === id)
    if (!c) throw new Error(id)
    return c
  },
}

/** Id do país da bandeira exibida (a classe fi-<id> do componente Flag) */
export function shownCountryId(flag: HTMLElement): string {
  const cls = [...flag.classList].find((c) => c.startsWith('fi-'))
  if (!cls) throw new Error('bandeira sem classe fi-')
  return cls.slice(3)
}
