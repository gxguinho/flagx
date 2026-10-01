import type { Member } from './types.ts'

/** Minúsculas, sem acentos, só letras/números separados por um espaço */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Se `text` menciona `term`. Termos com 5+ caracteres valem como substring
 * (pega "brasileiro" para "Brasil"); termos curtos só como palavra inteira
 * (evita "eua" dentro de "peruanos").
 */
export function containsTerm(text: string, term: string): boolean {
  const t = normalize(term)
  if (!t) return false
  const haystack = normalize(text)
  if (t.length >= 5) return haystack.includes(t)
  return ` ${haystack} `.includes(` ${t} `)
}

/** 0 = igual, 1 = começa com, 2 = alguma palavra começa com, 3 = contém */
function matchRank(candidate: string, query: string): number | null {
  if (candidate === query) return 0
  if (candidate.startsWith(query)) return 1
  if (candidate.split(' ').some((word) => word.startsWith(query))) return 2
  if (candidate.includes(query)) return 3
  return null
}

export function searchMembers(query: string, members: readonly Member[], limit = 8): Member[] {
  const q = normalize(query)
  if (!q) return []

  const ranked: { member: Member; rank: number }[] = []
  for (const member of members) {
    let best: number | null = null
    for (const term of [member.name, ...member.aliases]) {
      const rank = matchRank(normalize(term), q)
      if (rank !== null && (best === null || rank < best)) best = rank
    }
    if (best !== null) ranked.push({ member, rank: best })
  }

  return ranked
    .sort((a, b) => a.rank - b.rank || a.member.name.localeCompare(b.member.name, 'pt-BR'))
    .slice(0, limit)
    .map((r) => r.member)
}
