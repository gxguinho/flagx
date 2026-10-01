# flagx

**Descubra o país através do futebol.**

Jogo de adivinhação de países em que as dicas são sempre sobre futebol: a cada palpite errado, uma nova pista sobre jogadores, títulos, Copas, clubes e rivalidades daquela seleção. Quanto menos dicas, mais pontos.

O design completo está em [`docs/superpowers/specs/2026-10-01-flagx-design.md`](docs/superpowers/specs/2026-10-01-flagx-design.md).

## Stack

React + Vite + TypeScript · Tailwind CSS v4 · shadcn/ui · flag-icons · Vitest

## Desenvolvimento

```bash
pnpm install
pnpm dev        # servidor local
pnpm test       # testes
pnpm lint       # oxlint
pnpm build      # build de produção (dist/)
```

## Deploy

Vercel, importando este repositório (o preset Vite é detectado automaticamente). Cada push na `main` publica uma nova versão.
