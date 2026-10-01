export type Confederation = 'CONMEBOL' | 'UEFA' | 'CAF' | 'AFC' | 'CONCACAF' | 'OFC'

export type HintCategory =
  | 'jogador'
  | 'titulo'
  | 'copa'
  | 'clube'
  | 'rivalidade'
  | 'confederacao'
  | 'momento'
  | 'curiosidade'

export type Level = 1 | 2 | 3 | 4 | 5

export type Mode = 'normal' | 'facil'

export interface Hint {
  id: string
  text: string
  category: HintCategory
  /** 1 = vaga … 5 = praticamente entrega a resposta */
  level: Level
  reviewed: boolean
}

/** Membro da FIFA, de data/members.json */
export interface Member {
  /** Código do flag-icons: "br", "gb-eng", "xk"... */
  id: string
  name: string
  aliases: string[]
  confederation: Confederation
}

/** Conteúdo de um país, de data/countries/<id>.json */
export interface CountryContent {
  id: string
  /** Quão reconhecível é a bandeira (1 = muito fácil) */
  flagDifficulty: Level
  hints: Hint[]
}

export interface Country extends Member {
  flagDifficulty: Level
  hints: Hint[]
}
