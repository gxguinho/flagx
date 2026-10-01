# flagx — Plano de implementação do jogo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o projeto base em um jogo jogável — desafio diário e modo livre, níveis normal/fácil, validação de dados e um primeiro lote de 32 seleções com dicas.

**Architecture:** Lógica do jogo em TypeScript puro (`src/game/`), testada isoladamente; dados em JSON validados por Zod antes do build; UI em React + shadcn/ui que só orquestra estado e persiste em `localStorage`.

**Tech Stack:** React 19, Vite 8, TypeScript 6, Tailwind v4, shadcn/ui (radix-nova), flag-icons, Zod, tsx, Vitest + Testing Library, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-01-flagx-design.md`

## Escopo deste plano

- Entra: toda a lógica, validador, UI completa, registro dos **211 membros da FIFA** e conteúdo (dicas) de **32 seleções**.
- Fica para o próximo plano: dicas das 179 seleções restantes, em lotes por confederação (seção 7 da spec).

**Ajuste de modelo de dados em relação à spec (seção 2):** os metadados (`id`, `name`, `aliases`, `confederation`) ficam num registro único `data/members.json` com os 211 membros; cada `data/countries/<id>.json` guarda só `{ id, flagDifficulty, hints }`. Motivo: o autocomplete e as opções do modo fácil precisam listar os 211 países desde já — se listassem só os 32 com dicas, entregariam o conjunto de respostas. O tipo `Country` em runtime continua sendo a junção dos dois, exatamente como na spec. A Task 10 atualiza a spec.

## Global Constraints

- Idioma da interface: pt-BR. Identificadores de código em inglês.
- Universo: 211 membros da FIFA; `id` = código do `flag-icons` (`br`, `gb-eng`, `xk`…).
- Dicas por país: 8 a 12, pelo menos uma de cada nível 1–5; texto nunca contém nome nem alias do país.
- Modo normal: máximo 6 tentativas; pontos 1000/800/600/400/250/100; erro = 0.
- Modo fácil: 4 opções (3 da mesma confederação, fallback para outras), máximo 4 tentativas; pontos 500/400/300/200.
- Diário: 5 bandeiras, uma por `flagDifficulty` 1→5; `LAUNCH_DATE = "2026-10-01"` é o `#1`; dia vira à meia-noite de `America/Sao_Paulo`.
- Quadrados: `🟩` 0 dicas · `🟨` 1–2 · `🟧` 3–5 · `🟥` errou.
- Modo livre: não repetir os últimos 20 países.
- Persistência: `localStorage`, chave `flagx:v1`, toda leitura/escrita em try/catch.
- Imports dentro de `src/` usam o alias `@/`. Componentes shadcn são importados de `@/components/ui/*` e não são editados (exceto o que já foi).
- Toda tarefa termina com `pnpm test` e `pnpm lint` sem erros (os 2 avisos `only-export-components` dos arquivos shadcn são esperados).

## Review Focus

1. **Nomes com acento, apóstrofo, hífen e várias palavras** — "costa do marfim", "sao tome", "bosnia", "guine bissau" precisam encontrar o país. Teste na Task 2.
2. **Virada do dia em Brasília** — 23:59 de Brasília (02:59 UTC) e 00:00 (03:00 UTC) dão desafios diferentes, mesmo com o relógio do jogador em outro fuso. Teste na Task 6.
3. **`localStorage` corrompido, de versão antiga ou que lança exceção** — o jogo abre com dados zerados, sem quebrar. Teste na Task 8.
4. **Recarregar a página no meio do diário** — volta na mesma rodada, com as mesmas dicas já reveladas. Teste na Task 6 (`currentRoundIndex` após ida e volta por JSON).
5. **Busca curta e ambígua** — "ira" lista Irã e Iraque; resultados que começam com o termo vêm antes dos que só contêm; nunca mais de 8. Teste na Task 2.

---

### Task 1: Dependências, tipos e gerador com semente

**Files:**
- Modify: `package.json` (deps)
- Create: `src/game/types.ts`, `src/game/rng.ts`
- Test: `src/game/rng.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // types.ts
  export type Confederation = "CONMEBOL" | "UEFA" | "CAF" | "AFC" | "CONCACAF" | "OFC"
  export type HintCategory = "jogador" | "titulo" | "copa" | "clube" | "rivalidade" | "confederacao" | "momento" | "curiosidade"
  export type Level = 1 | 2 | 3 | 4 | 5
  export type Mode = "normal" | "facil"
  export interface Hint { id: string; text: string; category: HintCategory; level: Level; reviewed: boolean }
  export interface Member { id: string; name: string; aliases: string[]; confederation: Confederation }
  export interface CountryContent { id: string; flagDifficulty: Level; hints: Hint[] }
  export interface Country extends Member { flagDifficulty: Level; hints: Hint[] }
  // rng.ts
  export type Rng = () => number            // [0, 1)
  export function hashString(s: string): number   // FNV-1a 32 bits, sem sinal
  export function createRng(seed: number): Rng    // mulberry32
  export function randomSeed(): number
  export function pick<T>(rng: Rng, items: readonly T[]): T
  export function shuffle<T>(rng: Rng, items: readonly T[]): T[]  // Fisher-Yates, não muta
  ```

- [ ] **Step 1:** `pnpm add zod` e `pnpm add -D tsx`.
- [ ] **Step 2: Testes que falham** em `src/game/rng.test.ts`:
  - `createRng(42)` chamado 5 vezes gera a mesma sequência de outra instância `createRng(42)`; `createRng(43)` gera sequência diferente.
  - 1000 valores ficam em `[0, 1)`.
  - `hashString("flagx") === hashString("flagx")`, `hashString("a") !== hashString("b")`, resultado inteiro `>= 0`.
  - `shuffle(rng, [1,2,3,4,5])` contém os mesmos elementos, não altera o array original, e é igual para a mesma semente.
  - `pick` sempre devolve elemento do array.
- [ ] **Step 3:** Rodar `pnpm test src/game/rng.test.ts` → FAIL (módulo não existe).
- [ ] **Step 4:** Implementar `types.ts` e `rng.ts`. mulberry32:
  ```ts
  export function createRng(seed: number): Rng {
    let a = seed >>> 0
    return () => {
      a = (a + 0x6d2b79f5) >>> 0
      let t = a
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }
  ```
  FNV-1a: `h = 0x811c9dc5`; para cada char `h ^= code; h = Math.imul(h, 0x01000193)`; retornar `h >>> 0`.
- [ ] **Step 5:** `pnpm test` → PASS.
- [ ] **Step 6:** Commit `feat(game): add domain types and seeded rng`.

### Task 2: Normalização e busca de países

**Files:**
- Create: `src/game/normalize.ts`
- Test: `src/game/normalize.test.ts`

**Interfaces:**
- Consumes: `Member` (Task 1)
- Produces:
  ```ts
  export function normalize(s: string): string
  export function containsTerm(text: string, term: string): boolean
  export function searchMembers(query: string, members: readonly Member[], limit?: number): Member[] // limit padrão 8
  ```

- [ ] **Step 1: Testes que falham.** Fixture com membros: Brasil (`brazil`), Costa do Marfim (`costa do marfim`, aliases `["cote d'ivoire"]`), São Tomé e Príncipe, Bósnia e Herzegovina, Guiné-Bissau, Guiné, Irã (`["ira", "iran"]`), Iraque, Países Baixos (`["holanda"]`), Argentina.
  - `normalize("  São  Tomé ")` → `"sao tome"`; `normalize("Guiné-Bissau")` → `"guine bissau"`; `normalize("Côte d'Ivoire")` → `"cote d ivoire"`.
  - `searchMembers("sao tome", …)[0].name === "São Tomé e Príncipe"`; `"bosnia"` acha Bósnia; `"guine bissau"` acha Guiné-Bissau; `"cote"` acha Costa do Marfim pelo alias; `"holanda"` acha Países Baixos.
  - `searchMembers("ira", …)` contém Irã e Iraque, com Irã primeiro (nome normalizado é exatamente o termo / começa com ele).
  - `searchMembers("guine", …)` lista Guiné antes de Guiné-Bissau (match exato > começa com > contém).
  - `searchMembers("", …)` e `searchMembers("   ", …)` → `[]`.
  - Com 20 membros que contêm "a", `searchMembers("a", membros)` tem tamanho 8.
  - `containsTerm("O futebol brasileiro é famoso", "Brasil")` → `true` (termo com ≥ 5 caracteres: substring).
  - `containsTerm("Os peruanos jogam bem", "eua")` → `false`; `containsTerm("Os EUA sediaram a Copa", "eua")` → `true` (termo com < 5 caracteres: palavra inteira).
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Implementar. `normalize`: `NFD` → remover `\p{Diacritic}` → minúsculas → trocar tudo que não for `[a-z0-9]` por espaço → colapsar espaços → `trim`. `searchMembers` pontua cada membro pelo melhor entre nome e aliases normalizados: 0 = igual, 1 = começa com, 2 = alguma palavra começa com, 3 = contém; descarta sem match; ordena por pontuação e depois por `name` com `localeCompare(…, "pt-BR")`.
- [ ] **Step 4:** `pnpm test` → PASS.
- [ ] **Step 5:** Commit `feat(game): add text normalization and country search`.

### Task 3: Seleção das 5 dicas

**Files:**
- Create: `src/game/hints.ts`
- Test: `src/game/hints.test.ts`

**Interfaces:**
- Consumes: `Country`, `Hint`, `Rng`, `pick`
- Produces: `export function selectHints(country: Country, rng: Rng): Hint[]` — sempre 5 dicas, níveis 1, 2, 3, 4, 5 nessa ordem.

- [ ] **Step 1: Testes que falham** (fixture de país com 10 dicas, 2 por nível, categorias variadas):
  - Resultado tem 5 dicas com `level` `[1,2,3,4,5]`.
  - Mesma semente → mesmos ids; em 50 sementes diferentes aparece mais de uma combinação.
  - Fixture onde o nível 2 tem uma dica da mesma categoria da única dica de nível 1 e outra de categoria diferente: em 50 sementes, a dica de nível 2 nunca repete a categoria da anterior.
  - Fixture onde o nível 2 só tem dica da mesma categoria do nível 1: ainda retorna 5 dicas (repetição permitida quando não há alternativa).
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Implementar: para cada nível 1→5, candidatos = dicas do nível; preferidos = candidatos com categoria ≠ categoria da dica escolhida antes; `pick(rng, preferidos.length ? preferidos : candidatos)`.
- [ ] **Step 4:** `pnpm test` → PASS.
- [ ] **Step 5:** Commit `feat(game): select one hint per level`.

### Task 4: Pontuação e opções do modo fácil

**Files:**
- Create: `src/game/scoring.ts`, `src/game/choices.ts`
- Test: `src/game/scoring.test.ts`, `src/game/choices.test.ts`

**Interfaces:**
- Consumes: `Mode`, `Member`, `Rng`, `shuffle`
- Produces:
  ```ts
  export const MAX_ATTEMPTS: Record<Mode, number>  // { normal: 6, facil: 4 }
  export function scoreFor(mode: Mode, attempt: number | null): number // attempt = tentativa do acerto (1-based); null = errou
  export function buildChoices(answer: Member, members: readonly Member[], rng: Rng): Member[] // 4 itens
  ```

- [ ] **Step 1: Testes que falham.**
  - `scoreFor("normal", n)` para n = 1..6 → `[1000, 800, 600, 400, 250, 100]`; `scoreFor("normal", null)` → `0`.
  - `scoreFor("facil", n)` para n = 1..4 → `[500, 400, 300, 200]`; `scoreFor("facil", null)` → `0`.
  - `buildChoices(brasil, membros)` com 6 membros da CONMEBOL e 5 da UEFA: 4 itens distintos, contém Brasil, os outros 3 são CONMEBOL.
  - Com apenas 2 membros na OFC (resposta + 1): 4 itens distintos, contém a resposta e o outro da OFC, completa com 2 de outras confederações.
  - Mesma semente → mesma lista, na mesma ordem.
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Implementar. `buildChoices`: embaralhar mesma confederação (sem a resposta) e pegar até 3; completar com o embaralhamento das demais; embaralhar `[answer, ...distratores]`.
- [ ] **Step 4:** `pnpm test` → PASS.
- [ ] **Step 5:** Commit `feat(game): add scoring tables and easy-mode choices`.

### Task 5: Máquina da rodada

**Files:**
- Create: `src/game/round.ts`
- Test: `src/game/round.test.ts`

**Interfaces:**
- Consumes: `Mode`, `Hint`, `MAX_ATTEMPTS`, `scoreFor`
- Produces:
  ```ts
  export type RoundStatus = "playing" | "won" | "lost"
  export type Square = "🟩" | "🟨" | "🟧" | "🟥"
  export interface RoundState {
    countryId: string
    mode: Mode
    hints: Hint[]          // as 5 selecionadas
    choiceIds: string[]    // 4 ids no fácil; [] no normal
    wrongIds: string[]     // palpites errados, em ordem
    status: RoundStatus
  }
  export type RoundAction = { type: "guess"; memberId: string }
  export function createRound(args: { countryId: string; mode: Mode; hints: Hint[]; choiceIds?: string[] }): RoundState
  export function roundReducer(state: RoundState, action: RoundAction): RoundState
  export function revealedHints(state: RoundState): Hint[]   // hints.slice(0, min(wrongIds.length, 5))
  export function roundScore(state: RoundState): number      // won → scoreFor(mode, wrongIds.length + 1); senão 0
  export function squareFor(state: RoundState): Square       // lost 🟥; 0 dicas 🟩; 1–2 🟨; 3–5 🟧
  ```
  `RoundState` é JSON puro (vai para o `localStorage`).

- [ ] **Step 1: Testes que falham.**
  - Acerto de primeira: `status "won"`, `roundScore 1000`, `squareFor "🟩"`, `revealedHints` vazio.
  - Dois erros e acerto: `wrongIds` com 2 ids, `revealedHints` com níveis `[1,2]`, `roundScore 600`, `🟨`.
  - Seis erros no normal: `status "lost"`, `roundScore 0`, `🟥`, `revealedHints` com 5 dicas.
  - Palpite repetido (mesmo id já em `wrongIds`) devolve o **mesmo objeto** de estado.
  - Palpite depois de `won`/`lost` devolve o mesmo objeto.
  - Fácil: palpite fora de `choiceIds` devolve o mesmo objeto; três erros e acerto → `roundScore 200`, `🟧`.
  - Estado passa por `JSON.parse(JSON.stringify(s))` e continua funcionando no reducer.
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Implementar (reducer puro, sem mutação).
- [ ] **Step 4:** `pnpm test` → PASS.
- [ ] **Step 5:** Commit `feat(game): add round state machine`.

### Task 6: Desafio diário (datas, países do dia, execução)

**Files:**
- Create: `src/game/daily.ts`
- Test: `src/game/daily.test.ts`

**Interfaces:**
- Consumes: `Country`, `Member`, `Mode`, `hashString`, `createRng`, `shuffle`, `selectHints`, `buildChoices`, `createRound`, `RoundState`, `roundScore`, `squareFor`, `Square`
- Produces:
  ```ts
  export const LAUNCH_DATE = "2026-10-01"
  export const TIMEZONE = "America/Sao_Paulo"
  export const DAILY_SIZE = 5
  export function dateKey(now: Date): string            // "YYYY-MM-DD" no fuso de Brasília
  export function puzzleNumber(key: string): number     // LAUNCH_DATE → 1
  export function msUntilNextPuzzle(now: Date): number
  export function dailyCountries(puzzle: number, countries: readonly Country[]): Country[] // 5, flagDifficulty 1→5
  export interface DailyRecord { puzzle: number; mode: Mode; rounds: RoundState[] }
  export function createDailyRun(puzzle: number, mode: Mode, countries: readonly Country[], members: readonly Member[]): DailyRecord
  export function currentRoundIndex(record: DailyRecord): number // primeira rodada "playing"; -1 se todas acabaram
  export function dailyTotals(record: DailyRecord): { total: number; squares: Square[] }
  ```

- [ ] **Step 1: Testes que falham.**
  - `dateKey(new Date("2026-10-02T02:59:00Z"))` → `"2026-10-01"`; `dateKey(new Date("2026-10-02T03:00:00Z"))` → `"2026-10-02"`.
  - `puzzleNumber("2026-10-01")` → `1`; `puzzleNumber("2026-10-31")` → `31`; `puzzleNumber("2027-01-01")` → `93`.
  - `msUntilNextPuzzle(new Date("2026-10-02T02:59:00Z"))` → `60_000`.
  - Fixture com 3 países por `flagDifficulty`: `dailyCountries(7, …)` tem 5 países com `flagDifficulty` `[1,2,3,4,5]`; chamada repetida dá os mesmos ids; os dias 1, 2 e 3 usam 3 países diferentes na faixa 1 (sem repetição dentro do ciclo); o dia 4 repete o país do dia 1 na faixa 1.
  - `createDailyRun(1, "facil", …)` → 5 rodadas, cada uma com 5 dicas e 4 `choiceIds`; chamada repetida produz rodadas idênticas (`toEqual`).
  - `currentRoundIndex`: run novo → `0`; após vencer a rodada 0 e passar o record por `JSON.parse(JSON.stringify(…))` → `1`; com tudo terminado → `-1`.
  - `dailyTotals` soma `roundScore` e devolve os 5 quadrados em ordem.
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Implementar.
  - `dateKey`: `Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now)`.
  - `puzzleNumber`: diferença em dias entre `Date.UTC` das duas datas + 1.
  - `msUntilNextPuzzle`: próxima meia-noite = `Date.parse(`${amanhã}T00:00:00-03:00`)` — Brasília não tem horário de verão desde 2019 (comentar isso no código).
  - `dailyCountries`: para cada faixa d, ordenar por `id`, `shuffle(createRng(hashString(`bucket-${d}`)), faixa)`, pegar `[(puzzle - 1) % tamanho]`.
  - `createDailyRun`: para cada país do dia, `rng = createRng(hashString(`${puzzle}:${country.id}`))`; dicas `selectHints(country, rng)`; no fácil, `buildChoices` com o mesmo `rng` (ids).
- [ ] **Step 4:** `pnpm test` → PASS.
- [ ] **Step 5:** Commit `feat(game): add daily challenge schedule and run`.

### Task 7: Texto de compartilhamento e sorteio do modo livre

**Files:**
- Create: `src/game/share.ts`, `src/game/free.ts`
- Test: `src/game/share.test.ts`, `src/game/free.test.ts`

**Interfaces:**
- Consumes: `Mode`, `Square`, `Country`, `Rng`, `pick`
- Produces:
  ```ts
  export function buildShareText(args: { puzzle: number; mode: Mode; total: number; squares: Square[]; url: string }): string
  export const RECENT_LIMIT = 20
  export function pickFreeCountry(countries: readonly Country[], recentIds: readonly string[], rng: Rng): Country
  export function pushRecent(recentIds: readonly string[], id: string): string[] // mantém os últimos RECENT_LIMIT
  ```

- [ ] **Step 1: Testes que falham.**
  - `buildShareText({ puzzle: 42, mode: "normal", total: 3400, squares: ["🟩","🟩","🟨","🟧","🟥"], url: "https://flagx.vercel.app" })` → `"flagx #42 · 3.400 pts\n🟩🟩🟨🟧🟥\nhttps://flagx.vercel.app"`.
  - Mesmo com `mode: "facil", total: 1700` → primeira linha `"flagx #42 · 1.700 pts (fácil)"`.
  - `total: 800` → `"800 pts"` (sem separador).
  - `pickFreeCountry` com 25 países e 20 recentes nunca devolve um recente (100 sementes).
  - Com 10 países e os 10 recentes: devolve algum país (fallback para todos).
  - `pushRecent` com 20 ids + novo → 20 ids, o mais antigo saiu, o novo é o último.
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Implementar (número com `Intl.NumberFormat("pt-BR")`).
- [ ] **Step 4:** `pnpm test` → PASS.
- [ ] **Step 5:** Commit `feat(game): add share text and free-mode picker`.

### Task 8: Persistência e estatísticas

**Files:**
- Create: `src/storage/storage.ts`
- Test: `src/storage/storage.test.ts`

**Interfaces:**
- Consumes: `DailyRecord`, `Square`
- Produces:
  ```ts
  export const STORAGE_KEY = "flagx:v1"
  export interface Stats {
    played: number; streak: number; maxStreak: number; lastPuzzle: number | null
    totalPoints: number; squares: Record<Square, number>
  }
  export interface SaveData { version: 1; daily: DailyRecord | null; stats: Stats; freeBest: number }
  export function emptySave(): SaveData
  export function loadSave(storage?: Storage | null): SaveData
  export function writeSave(data: SaveData, storage?: Storage | null): void
  export function recordDailyFinished(save: SaveData, puzzle: number, total: number, squares: Square[]): SaveData
  ```
  O parâmetro `storage` padrão é obtido por uma função interna que faz `try { return window.localStorage } catch { return null }`.

- [ ] **Step 1: Testes que falham** (com um `Storage` falso em memória):
  - Storage vazio → `emptySave()`.
  - `writeSave` e depois `loadSave` devolvem os mesmos dados.
  - Valor `"{quebrado"` → `emptySave()`; JSON válido com `version: 0` → `emptySave()`.
  - Storage cujo `getItem`/`setItem` lança exceção → `loadSave` devolve `emptySave()` e `writeSave` não lança; `loadSave(null)` → `emptySave()`.
  - `recordDailyFinished` no puzzle 5 com `lastPuzzle 4, streak 2` → `streak 3`, `played +1`, `totalPoints` somado, contadores de quadrados somados; `maxStreak` atualizado.
  - Com `lastPuzzle 2` e puzzle 5 → `streak 1`.
  - Chamar duas vezes no mesmo puzzle não conta em dobro (devolve o mesmo objeto).
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Implementar. `loadSave` valida o mínimo (`version === 1` e presença de `stats`); qualquer outra coisa vira `emptySave()`.
- [ ] **Step 4:** `pnpm test` → PASS.
- [ ] **Step 5:** Commit `feat(storage): add versioned save and daily stats`.

### Task 9: Schemas e validador de dados

**Files:**
- Create: `src/data/schema.ts`, `src/data/validate.ts`, `scripts/validate.ts`, `scripts/review-report.ts`
- Modify: `package.json` (scripts)
- Test: `src/data/validate.test.ts`

**Interfaces:**
- Consumes: tipos da Task 1, `normalize`, `containsTerm`
- Produces:
  ```ts
  // schema.ts — Zod
  export const memberSchema, membersSchema (array), hintSchema, countryContentSchema
  // validate.ts
  export function validateDataset(input: {
    members: unknown
    contents: Record<string, unknown>   // chave = nome do arquivo sem .json
    flagExists: (id: string) => boolean
  }): string[]                           // lista de erros legíveis em pt-BR; [] = válido
  ```
  Scripts no `package.json`: `"validate": "tsx scripts/validate.ts"`, `"review-report": "tsx scripts/review-report.ts"`.

- [ ] **Step 1: Testes que falham.** Fixture válida: 5 membros, 5 países (um por `flagDifficulty`) com 8 dicas cada cobrindo os níveis 1–5, `flagExists = () => true`. Cada caso abaixo altera a fixture e espera um erro que mencione o id envolvido:
  - Fixture válida com 5 países (um por `flagDifficulty`) → `[]`.
  - Membro duplicado (`id` repetido); alias normalizado igual ao nome de outro membro.
  - Arquivo `ar` cujo conteúdo tem `id: "br"`; conteúdo de `id` que não existe em `members`.
  - País com 7 dicas; com 13 dicas; sem dica de nível 3.
  - Dica cujo texto contém "brasileiro" no país Brasil.
  - Id de dica repetido; id de dica fora do padrão `<countryId>-NN`.
  - `flagExists` retornando `false` para um membro.
  - Nenhum país com `flagDifficulty` 5.
  - Schema inválido (`level: 7`, `category: "estadio"`).
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Implementar `schema.ts` e `validate.ts` (puros, sem acesso a disco).
- [ ] **Step 4:** Implementar `scripts/validate.ts`: lê `data/members.json` e `data/countries/*.json`, `flagExists = id => existsSync("node_modules/flag-icons/flags/4x3/<id>.svg")`, imprime os erros e sai com código 1 se houver algum; senão imprime `✓ <n> membros, <m> países válidos`. `scripts/review-report.ts`: imprime por país `id  revisadas/total` e o total geral.
- [ ] **Step 5:** `pnpm test` → PASS.
- [ ] **Step 6:** Commit `feat(data): add zod schemas and dataset validator`.

### Task 10: Registro dos 211 membros da FIFA

**Files:**
- Create: `data/members.json`
- Modify: `docs/superpowers/specs/2026-10-01-flagx-design.md` (seção 2: registro `members.json` + conteúdo por país, conforme "Ajuste de modelo de dados" acima)

- [ ] **Step 1:** Escrever `data/members.json` com os 211 membros: `id` do flag-icons, `name` em pt-BR, `aliases` (nome em inglês, nomes populares no Brasil — "holanda", "eua", "inglaterra"…, grafias sem artigo), `confederation`. Distribuição esperada: UEFA 55, CAF 54, AFC 47, CONCACAF 35, OFC 10, CONMEBOL 10. Subdivisões britânicas: `gb-eng`, `gb-sct`, `gb-wls`, `gb-nir`. Kosovo: `xk`. Palestina: `ps`. Taiti: `pf`. Taipé Chinesa: `tw`. Hong Kong: `hk`. Macau: `mo`. Ilhas Faroé: `fo`. Gibraltar: `gi`. Curaçao: `cw`. Aruba: `aw`. Bermudas: `bm`. Ilhas Cayman: `ky`. Ilhas Virgens Britânicas: `vg`. Ilhas Virgens Americanas: `vi`. Porto Rico: `pr`. Montserrat: `ms`. Anguila: `ai`. Turks e Caicos: `tc`. Samoa Americana: `as`. Ilhas Cook: `ck`. Nova Caledônia: `nc`.
- [ ] **Step 2:** Rodar `pnpm validate`. Expected: só o erro da regra 6 (nenhum país com conteúdo ainda); nenhum erro de schema, duplicata ou bandeira.
- [ ] **Step 3:** Conferir as contagens por confederação com um one-liner `node -e` e corrigir até bater 211 e a distribuição acima.
- [ ] **Step 4:** Atualizar a seção 2 da spec.
- [ ] **Step 5:** Commit `feat(data): add FIFA member registry`.

### Task 11: Conteúdo — lote 1a (CONMEBOL, CONCACAF, OFC)

**Files:**
- Create: `data/countries/{br,ar,uy,co,cl,pe,py,ec,bo,ve,mx,us,cr,nz}.json` (14)

- [ ] **Step 1:** Escrever os 14 arquivos seguindo o guia de níveis da spec (seção 7): 10 dicas por país (2 por nível), categorias variadas, `reviewed: false`, fatos estáveis, fatos recentes datados. Dicas nunca mencionam o nome do país, gentílico derivado (“brasileiro”) nem aliases. `flagDifficulty` sugerido: `br 1, ar 1, mx 1, us 1, uy 2, co 2, cl 2, pe 3, py 3, ec 3, cr 3, nz 4, ve 4, bo 4`.
- [ ] **Step 2:** `pnpm validate` → só pode restar o erro da faixa 5 vazia.
- [ ] **Step 3:** Commit `content: add batch 1a (CONMEBOL, CONCACAF, OFC)`.

### Task 12: Conteúdo — lote 1b (UEFA, CAF, AFC) e validação no build

**Files:**
- Create: `data/countries/{gb-eng,fr,de,es,it,pt,nl,be,hr,gb-sct,gb-wls,sm,ma,sn,cm,jp,kr,sa}.json` (18)
- Modify: `package.json` (`"build": "pnpm validate && tsc -b && vite build"`)

- [ ] **Step 1:** Escrever os 18 arquivos com as mesmas regras. `flagDifficulty` sugerido: `fr 1, de 1, it 1, es 1, pt 2, gb-eng 2, nl 2, jp 2, be 3, hr 3, kr 3, ma 3, gb-sct 4, sn 4, cm 4, sa 4, gb-wls 5, sm 5`.
- [ ] **Step 2:** `pnpm validate` → `✓ 211 membros, 32 países válidos`.
- [ ] **Step 3:** Atualizar o script `build` e rodar `pnpm build` → sucesso.
- [ ] **Step 4:** Commit `content: add batch 1b (UEFA, CAF, AFC); validate on build`.

### Task 13: Carregamento dos dados e componentes da rodada

**Files:**
- Create: `src/data/countries.ts`, `src/components/GuessInput.tsx`, `src/components/ChoiceGrid.tsx`, `src/components/HintList.tsx`, `src/game/categories.ts`
- Test: `src/components/GuessInput.test.tsx`

**Interfaces:**
- Consumes: `Member`, `Country`, `CountryContent`, `Hint`, `searchMembers`
- Produces:
  ```ts
  // src/data/countries.ts
  export const members: Member[]            // 211, ordenados por name (pt-BR)
  export const countries: Country[]         // só os que têm conteúdo
  export function getMember(id: string): Member      // lança se não existir
  export function getCountry(id: string): Country    // lança se não existir
  // src/game/categories.ts
  export const CATEGORY_LABEL: Record<HintCategory, string>
  // componentes
  GuessInput(props: { members: Member[]; excludedIds: string[]; onGuess(id: string): void; disabled?: boolean })
  ChoiceGrid(props: { choices: Member[]; wrongIds: string[]; onGuess(id: string): void; disabled?: boolean })
  HintList(props: { hints: Hint[] })
  ```
  `CATEGORY_LABEL`: `jogador "⚽ Jogador"`, `titulo "🏆 Título"`, `copa "🌍 Copa do Mundo"`, `clube "🏟️ Clube"`, `rivalidade "⚔️ Rivalidade"`, `confederacao "🗺️ Confederação"`, `momento "📅 Momento histórico"`, `curiosidade "💡 Curiosidade"`.

- [ ] **Step 1: Testes que falham** (`GuessInput`, com 4 membros de fixture):
  - Sem texto digitado, nenhuma opção aparece.
  - Digitar "arg" mostra a opção "Argentina"; clicar nela chama `onGuess("ar")` e limpa o campo.
  - Digitar "bra" e apertar Enter chama `onGuess("br")` (primeiro resultado destacado).
  - Membro em `excludedIds` aparece riscado e clicar nele não chama `onGuess`.
  - Digitar "zzz" mostra "Nenhum país encontrado".
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Implementar `countries.ts` com `import.meta.glob("../../data/countries/*.json", { eager: true, import: "default" })` e `import membersJson from "../../data/members.json"` (dados já validados no build, sem Zod em runtime).
- [ ] **Step 4:** Implementar `GuessInput` com `Command` (`shouldFilter={false}`), `CommandInput` (placeholder `"Digite o país..."`), `CommandList` só renderizado com texto, itens de `searchMembers`, `CommandEmpty` com `"Nenhum país encontrado"`; excluídos com `line-through` e `disabled`. `ChoiceGrid`: grade 2×2 de `Button`, errados desabilitados com variante `destructive`. `HintList`: lista de `Card` com `Badge` (`CATEGORY_LABEL`) e o texto, rotulados "Dica 1", "Dica 2"…
- [ ] **Step 5:** `pnpm test` → PASS.
- [ ] **Step 6:** Commit `feat(ui): add data loader and round input components`.

### Task 14: Tela da rodada, modo livre e navegação

**Files:**
- Create: `src/screens/RoundView.tsx`, `src/screens/FreeScreen.tsx`, `src/state/useSave.ts`
- Modify: `src/App.tsx`, `src/App.test.tsx`
- Test: `src/screens/FreeScreen.test.tsx`

**Interfaces:**
- Consumes: `RoundState`, `roundReducer`, `revealedHints`, `roundScore`, `createRound`, `selectHints`, `buildChoices`, `pickFreeCountry`, `pushRecent`, `randomSeed`, `createRng`, `getCountry`, `getMember`, `members`, `countries`, `loadSave`, `writeSave`, `SaveData`, componentes da Task 13, `Flag`
- Produces:
  ```ts
  export function useSave(): [SaveData, (update: (prev: SaveData) => SaveData) => void] // grava a cada update
  RoundView(props: {
    round: RoundState
    header: React.ReactNode
    onGuess(id: string): void
    onNext(): void
    nextLabel: string            // "Próxima" ou "Ver resultado"
  })
  FreeScreen(props: { save: SaveData; updateSave: (fn: (s: SaveData) => SaveData) => void; onBack(): void })
  export type Screen = "home" | "daily" | "free" | "stats"
  ```

- [ ] **Step 1: Teste que falha** (`FreeScreen`, com `vi.mock("@/data/countries")` devolvendo 2 países e seus membros, e `randomSeed` mockado):
  - A tela mostra a bandeira e o campo de palpite; digitar o nome errado e escolher → aparece "Dica 1".
  - Escolher o país certo → abre o diálogo com "Você acertou!", o nome do país, os pontos ("+800") e as 5 dicas; clicar "Próxima" mostra nova rodada e a pontuação da sessão "800".
  - Quando a pontuação da sessão passa `save.freeBest`, `updateSave` é chamado com `freeBest` atualizado.
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Implementar `useSave` (`useState(loadSave)`; `update` aplica a função e chama `writeSave`).
- [ ] **Step 4:** Implementar `RoundView`: `Card` com `Flag` (`code = round.countryId`), `HintList` com `revealedHints`, `Badge`s dos `wrongIds` (nome via `getMember`), `GuessInput` (normal) ou `ChoiceGrid` (fácil, opções via `getMember`). Quando `status !== "playing"`, `Dialog` aberto com título "Você acertou!" ou "Não foi dessa vez", nome do país, `+{roundScore}` pontos, as 5 dicas completas e o botão `nextLabel`.
- [ ] **Step 5:** Implementar `FreeScreen`: alternador Normal/Fácil (trocar o modo inicia nova rodada, pontuação da sessão mantida), pontuação da sessão e recorde no cabeçalho, nova rodada a cada "Próxima" via `pickFreeCountry` + `selectHints` + (fácil) `buildChoices`, com `createRng(randomSeed())`. Ao fim de cada rodada, se a sessão superar `freeBest`, atualizar o save.
- [ ] **Step 6:** `App.tsx`: estado `screen: Screen`, `useSave`, Home provisória com "Modo livre" habilitado; atualizar `App.test.tsx` para o novo Home (título e slogan continuam).
- [ ] **Step 7:** `pnpm test` → PASS. Abrir `pnpm dev` no navegador e jogar duas rodadas no normal e uma no fácil.
- [ ] **Step 8:** Commit `feat(ui): add round view and free mode`.

### Task 15: Desafio diário na UI

**Files:**
- Create: `src/screens/DailyScreen.tsx`, `src/screens/DailySummary.tsx`, `src/components/ShareButton.tsx`, `src/components/Countdown.tsx`
- Modify: `src/App.tsx`
- Test: `src/screens/DailyScreen.test.tsx`, `src/components/ShareButton.test.tsx`

**Interfaces:**
- Consumes: `dateKey`, `puzzleNumber`, `createDailyRun`, `currentRoundIndex`, `dailyTotals`, `msUntilNextPuzzle`, `DAILY_SIZE`, `recordDailyFinished`, `buildShareText`, `roundReducer`, `RoundView`, `useSave` types, `toast` de `sonner`
- Produces:
  ```ts
  DailyScreen(props: { save: SaveData; updateSave(fn): void; now?: () => Date; onBack(): void })
  DailySummary(props: { record: DailyRecord; onBack(): void })
  ShareButton(props: { text: string })
  Countdown(props: { now?: () => Date })   // "Próximo desafio em HH:MM:SS", atualiza a cada 1 s
  ```

- [ ] **Step 1: Testes que falham.**
  - `DailyScreen` sem `save.daily` do dia: mostra "Desafio #N" e os botões "Normal" e "Fácil"; escolher "Fácil" chama `updateSave` com `daily.mode "facil"` e 5 rodadas, e mostra "1/5".
  - Com `save.daily` do dia com a rodada 0 vencida: abre direto em "2/5" (retomada).
  - Com `save.daily` de um puzzle anterior: volta a mostrar a escolha de modo.
  - Ao terminar a 5ª rodada e clicar "Ver resultado": `updateSave` aplica `recordDailyFinished` e aparece o resumo com o total e os quadrados.
  - `ShareButton` com `navigator.share` definido chama `share({ text })`; sem ele chama `navigator.clipboard.writeText(text)` e mostra o toast "Copiado!"; `share` rejeitado com `AbortError` não chama o clipboard.
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Implementar `DailyScreen`: puzzle = `puzzleNumber(dateKey(now()))`; se `save.daily?.puzzle !== puzzle` → escolha de modo → `createDailyRun` e salvar. Durante o jogo: cabeçalho com `Progress` (`(índice / DAILY_SIZE) * 100`), "Diário #N · i/5" e pontos acumulados; cada palpite aplica `roundReducer` na rodada atual e salva o record inteiro. O índice exibido é a última rodada terminada até o jogador clicar em "Próxima" (estado local `viewIndex`), para o diálogo de resultado não sumir. Após a 5ª, `recordDailyFinished` e `DailySummary`.
- [ ] **Step 4:** Implementar `DailySummary` (total formatado, linha de quadrados, lista dos 5 países com pontos, `ShareButton` com `buildShareText({ …, url: window.location.origin })`, `Countdown`), `ShareButton` e `Countdown`.
- [ ] **Step 5:** Ligar no `App.tsx` (`screen "daily"`).
- [ ] **Step 6:** `pnpm test` → PASS. No navegador: jogar o diário até o fim, recarregar no meio (deve retomar), compartilhar (desktop → toast).
- [ ] **Step 7:** Commit `feat(ui): add daily challenge flow and share`.

### Task 16: Início, estatísticas, como jogar e verificação final

**Files:**
- Create: `src/screens/Home.tsx`, `src/screens/StatsScreen.tsx`, `src/components/HowToPlay.tsx`
- Modify: `src/App.tsx`, `src/App.test.tsx`
- Test: `src/screens/Home.test.tsx`, `src/screens/StatsScreen.test.tsx`

**Interfaces:**
- Consumes: `SaveData`, `Stats`, `dateKey`, `puzzleNumber`, `currentRoundIndex`, `Dialog`
- Produces:
  ```ts
  export type DailyStatus = "novo" | "andamento" | "concluido"
  export function dailyStatus(save: SaveData, puzzle: number): DailyStatus // em Home.tsx
  Home(props: { puzzle: number; status: DailyStatus; onDaily(): void; onFree(): void; onStats(): void; onHelp(): void })
  StatsScreen(props: { save: SaveData; onBack(): void })
  HowToPlay(props: { open: boolean; onOpenChange(open: boolean): void })
  ```

- [ ] **Step 1: Testes que falham.**
  - `dailyStatus`: sem daily → `"novo"`; daily de outro puzzle → `"novo"`; em andamento → `"andamento"`; tudo terminado → `"concluido"`.
  - `Home` mostra "Desafio #N" com o rótulo "Jogar" / "Continuar" / "Ver resultado" conforme o status.
  - `StatsScreen` com `played 4, totalPoints 10000, streak 2, maxStreak 3, freeBest 4200` mostra "4", "2.500" (média), "2", "3", "4.200" e os quatro contadores de quadrados.
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Implementar `Home` (layout da tela provisória atual, botões habilitados; a bandeira decorativa sai), `StatsScreen`, `HowToPlay` (regras curtas: 6 tentativas, uma dica por erro, tabela de pontos, modo fácil vale metade, diário com 5 bandeiras e virada à meia-noite de Brasília). Ligar tudo no `App.tsx`; atualizar `App.test.tsx`.
- [ ] **Step 4:** Verificação final: `pnpm test`, `pnpm lint`, `pnpm build` sem erros; no navegador (celular e desktop, claro e escuro) percorrer Início → Diário completo → Resumo → Estatísticas → Modo livre → Como jogar, sem erros no console.
- [ ] **Step 5:** Commit `feat(ui): add home, stats and how-to-play` e `git push origin main`.
