# flagx — Design

**Descubra o país através do futebol.**

Data: 2026-10-01
Status: aprovado em conversa, aguardando revisão da spec escrita

## 1. Visão geral

flagx é um jogo web de adivinhação de países. A cada rodada uma bandeira é exibida; cada palpite errado libera uma nova dica, **sempre sobre futebol** (jogadores, títulos, Copas, clubes, rivalidades, confederação, momentos históricos, curiosidades). Quanto menos dicas o jogador usar, mais pontos ganha.

### Objetivo e público

- Protótipo para **jogar com amigos**: simples de usar, mas com conteúdo rico e bem estruturado.
- Sucesso = os amigos jogam o desafio diário, compartilham o resultado no WhatsApp e comparam pontuações.

### Decisões tomadas

| Tema | Decisão |
|---|---|
| Conteúdo | JSON versionado no repositório, um arquivo por país, sem servidor |
| Criação das dicas | Geradas com IA em lotes e revisadas por humanos |
| Cobertura | Os 211 membros da FIFA |
| Modos | Desafio diário (principal) + modo livre (treino) |
| Resposta | Normal = texto com autocomplete; Fácil = múltipla escolha |
| Diário | 5 bandeiras por dia, dificuldade crescente |
| Plataforma | Site responsivo mobile-first, hospedagem estática |
| Stack | React + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui |
| Persistência | `localStorage` (sem login) |

### Fora do escopo

Login, ranking online, PWA/offline, outros idiomas (o jogo é só pt-BR), sons, painel de administração.

## 2. Modelo de dados

### Universo de países

Os **211 membros da FIFA** — não os países da ONU. Inclui Inglaterra, Escócia, País de Gales e Irlanda do Norte separados, além de Ilhas Faroé, Gibraltar, Kosovo, etc.

### Bandeiras

SVGs locais do pacote `flag-icons` (MIT), que cobre subdivisões como `gb-eng`, `gb-sct`, `gb-wls`, `gb-nir`. Emoji de bandeira **não** é usado (não renderiza no Windows).

### Formato

Os dados ficam em dois lugares:

- `data/members.json` — registro dos **211 membros** (metadados), usado pelo autocomplete e pelas opções do modo fácil desde o início, mesmo para países que ainda não têm dicas. Assim a lista de palpites não entrega quais países estão em jogo.
- `data/countries/<id>.json` — conteúdo jogável de um país (`CountryContent`). Só países com esse arquivo aparecem como resposta.

Em runtime, `Country` é a junção dos dois.

```ts
type Confederation = "CONMEBOL" | "UEFA" | "CAF" | "AFC" | "CONCACAF" | "OFC";

type HintCategory =
  | "jogador" | "titulo" | "copa" | "clube"
  | "rivalidade" | "confederacao" | "momento" | "curiosidade";

// data/members.json → Member[]
interface Member {
  id: string;               // código do flag-icons: "br", "gb-eng", "xk"
  name: string;             // nome exibido em pt-BR: "Brasil"
  aliases: string[];        // nomes alternativos aceitos: ["brazil"]
  confederation: Confederation;
}

// data/countries/<id>.json
interface CountryContent {
  id: string;
  flagDifficulty: 1 | 2 | 3 | 4 | 5; // quão reconhecível é a bandeira (1 = muito fácil)
  hints: Hint[];            // pool de 8 a 12 dicas
}

type Country = Member & CountryContent;

interface Hint {
  id: string;               // "<countryId>-<nn>": "br-07"
  text: string;
  category: HintCategory;
  level: 1 | 2 | 3 | 4 | 5; // 1 = vaga … 5 = praticamente entrega a resposta
  reviewed: boolean;
}
```

### Regras de validação (Zod, `scripts/validate.ts`)

1. Os arquivos seguem os schemas acima; `id` do arquivo = `id` do país, e todo país com conteúdo existe em `members.json`.
2. Cada país tem **8 a 12 dicas** e **pelo menos uma dica de cada nível 1–5**.
3. Nenhum texto de dica contém o nome do país ou qualquer alias (comparação normalizada: sem acento, minúsculas).
4. IDs de país, IDs de dica e nomes/aliases normalizados são únicos em todo o conjunto.
5. Existe SVG correspondente no `flag-icons` para cada `id`.
6. Cada faixa de `flagDifficulty` (1–5) tem pelo menos um país (necessário para o desafio diário).

O validador roda antes do build e no CI; dado inválido não é publicado. Em runtime os dados são tratados como confiáveis.

Dicas com `reviewed: false` são jogadas normalmente. `scripts/review-report.ts` lista, por país, quantas dicas estão revisadas.

## 3. Rodada e pontuação

### Modo normal (autocomplete)

1. A bandeira aparece sem dicas — tentativa 1.
2. O jogador digita; o autocomplete filtra os países por nome e aliases, ignorando acentos e maiúsculas. Só é aceito um país selecionado da lista (erro de digitação nunca consome tentativa).
3. Cada erro revela a próxima dica, do nível 1 ao 5.
4. Máximo de **6 tentativas** (bandeira pura + 5 dicas). Errando a 6ª, a resposta é revelada.
5. Um país já chutado aparece riscado na lista e não pode ser chutado de novo.

### Seleção das dicas

`selectHints(country, rng)` escolhe **uma dica de cada nível** (1→5) do pool, evitando duas categorias iguais em sequência quando houver alternativa. O `rng` é um gerador com semente (mulberry32 + hash de string):

- Diário: semente derivada de `data + id do país` → todos os jogadores veem as mesmas dicas.
- Livre: semente aleatória.

### Pontuação — modo normal

| Acertou na tentativa | Dicas usadas | Pontos |
|---|---|---|
| 1 | 0 | 1000 |
| 2 | 1 | 800 |
| 3 | 2 | 600 |
| 4 | 3 | 400 |
| 5 | 4 | 250 |
| 6 | 5 | 100 |
| errou | 5 | 0 |

### Modo fácil (múltipla escolha)

- 4 opções: a correta + 3 da **mesma confederação**. Se a confederação não tiver países suficientes, completa com países de outras confederações.
- Cada erro elimina a opção escolhida e revela uma dica (máximo 3 erros; o jogador sempre acerta até a 4ª tentativa).
- Pontos: 500 / 400 / 300 / 200 para acerto na 1ª / 2ª / 3ª / 4ª tentativa.

## 4. Desafio diário, modo livre e persistência

### Desafio diário

- **Número do desafio:** dias desde a data de lançamento (constante `LAUNCH_DATE`); o dia de lançamento é o `#1`.
- **Virada do dia:** meia-noite no fuso `America/Sao_Paulo`, para todos.
- **5 bandeiras** em dificuldade crescente: uma de cada `flagDifficulty` 1→5.
- **Escolha dos países (sem servidor):** os países de cada faixa de `flagDifficulty` são embaralhados com semente fixa; o desafio N usa o índice `N mod tamanhoDaFaixa` de cada faixa. Nenhum país se repete até a faixa completar um ciclo. *Trade-off aceito:* adicionar países (ou mudar `flagDifficulty`) altera a sequência a partir do dia do deploy, inclusive o próprio dia; por isso conteúdo novo é publicado logo após a meia-noite de Brasília. A ordenação usa comparação por code point, para não depender do idioma do navegador.
- O jogador escolhe **normal ou fácil** ao começar; a escolha vale para o desafio do dia inteiro.
- Cada desafio é jogado **uma vez**. Fechar a aba no meio não perde o progresso: ao voltar, continua de onde parou.
- Ao final: pontuação total, quadrados, botão **Compartilhar** e contagem regressiva para o próximo desafio.

### Texto compartilhável

```
flagx #42 · 3.400 pts
🟩🟩🟨🟧🟥
<url do jogo>
```

- `🟩` acertou sem dica · `🟨` 1–2 dicas · `🟧` 3–5 dicas · `🟥` errou.
- No modo fácil: `flagx #42 · 1.700 pts (fácil)`.
- Usa Web Share API quando disponível (celular); senão copia para a área de transferência e mostra um toast "Copiado!".

### Modo livre

- Rodadas infinitas com países sorteados entre todos, sem repetir os últimos 20.
- Pontuação acumulada na sessão; recorde salvo.
- O jogador pode alternar entre normal e fácil a qualquer momento.

### Persistência (`localStorage`)

Chave única versionada (ex.: `flagx:v1`) contendo:

- Estado do desafio diário em andamento/concluído (por número do desafio).
- Estatísticas: jogos, sequência de dias seguidos, média de pontos, distribuição de 🟩🟨🟧🟥.
- Recorde do modo livre.

Trocar de dispositivo ou limpar o navegador perde o histórico (aceito para o protótipo).

## 5. Telas e UI

UI com **Tailwind CSS v4 + shadcn/ui**. Componentes copiados em `src/components/ui/`; alias `@/` configurado no Vite e no TypeScript. Tema padrão do shadcn com variáveis CSS, cor primária verde-gramado, modo escuro seguindo o sistema. Layout mobile-first, totalmente usável por teclado no desktop.

| Tela | Conteúdo |
|---|---|
| **Início** | Logo + slogan; botão do desafio diário (estado: Jogar / Continuar / Ver resultado); Modo livre; Estatísticas; Como jogar |
| **Rodada** | Cabeçalho com progresso (`Progress`, ex.: 2/5) e pontos; bandeira grande (`Card`); dicas reveladas com `Badge` da categoria; chutes errados (`Badge`); campo de palpite (`Command` + `Popover`) ou 4 `Button`s no modo fácil |
| **Fim da rodada** | `Dialog`: acertou/errou, nome do país, pontos e **todas as 5 dicas** reveladas; botão "Próxima" |
| **Resumo do diário** | Total, quadrados, Compartilhar, contagem para o próximo |
| **Estatísticas** | Números de `localStorage` |
| **Como jogar** | `Dialog` com regras curtas |

Mapeamento shadcn: `Command`/`Popover` (autocomplete; a filtragem usa `normalize.ts`), `Button`, `Card`, `Badge`, `Dialog`, `Progress`, `Sonner`.

Navegação via estado simples no `App` (sem router).

## 6. Arquitetura do código

Princípio: **a lógica do jogo é TypeScript puro, sem React**, e é testada isoladamente.

```
data/countries/*.json          conteúdo
scripts/
  validate.ts                  validador Zod (pré-build e CI)
  review-report.ts             progresso da revisão
src/
  game/                        lógica pura
    rng.ts                     PRNG com semente (mulberry32 + hash de string)
    normalize.ts               normalização de texto e busca por nome/alias
    hints.ts                   selectHints(country, rng) → Hint[5]
    choices.ts                 opções do modo fácil
    scoring.ts                 tabelas de pontos
    daily.ts                   número do desafio e países do dia
    round.ts                   roundReducer(state, action)
    share.ts                   texto compartilhável
  data/countries.ts            carrega os JSONs (import.meta.glob)
  storage/storage.ts           wrapper de localStorage (chave versionada, try/catch)
  components/ui/               componentes shadcn
  components/                  Flag, GuessInput, ChoiceGrid, HintList, ShareButton…
  screens/                     Home, Round, DailySummary, Free, Stats
```

Hospedagem estática (Vercel ou Netlify). O script de build roda o validador antes do `vite build`.

## 7. Geração de conteúdo

- Gerado por IA em **lotes por confederação** (15–20 países por lote): CONMEBOL (10), UEFA (55, em 3 lotes), CONCACAF, CAF, AFC, OFC. Cada lote passa no validador antes do próximo.
- **Guia de níveis:**
  - 1 — confederação, estatística vaga, curiosidade genérica
  - 2 — histórico em Copas, títulos continentais
  - 3 — clubes, estádios, rivalidades
  - 4 — jogadores conhecidos
  - 5 — maior ídolo ou momento mais icônico (quase entrega)
- **Precisão:** priorizar fatos históricos estáveis; evitar fatos voláteis (técnico atual, "artilheiro em atividade"); fatos recentes devem ser datados ("até 2026, …"). Seleções pequenas recebem curiosidades reais em vez de dicas genéricas repetidas.
- `flagDifficulty` é sugerido na geração e revisável.
- Revisão humana diretamente nos JSONs: corrigir o texto e marcar `reviewed: true`.

## 8. Tratamento de erros

- **Dados:** barrados no build pelo validador (seção 2).
- **`localStorage` indisponível** (aba anônima, bloqueio): o jogo funciona, apenas sem salvar. Dado com versão antiga ou corrompido é descartado.
- **Modo fácil com confederação pequena:** fallback para outras confederações.
- **Web Share indisponível ou cancelado:** cai para copiar na área de transferência.

## 9. Testes

Vitest + Testing Library.

- `src/game/` (cobertura praticamente total):
  - `rng`: mesma semente → mesma sequência.
  - `hints`: uma dica por nível, ordem 1→5, sem categoria repetida em sequência quando possível, determinístico por semente.
  - `daily`: mesma data → mesmos países; virada à meia-noite de Brasília; sem repetição dentro do ciclo da faixa.
  - `scoring`: tabelas normal e fácil.
  - `normalize`: "sao tome" encontra "São Tomé e Príncipe"; "holanda" encontra "Países Baixos".
  - `choices`: distratores da mesma confederação, distintos, com fallback.
  - `round`: transições, bloqueio de palpite repetido, vitória, derrota.
  - `share`: texto e emojis.
- Validador testado com fixtures válidas e inválidas.
- Componentes: `GuessInput` e uma rodada completa.
- Sem testes E2E nesta fase.
