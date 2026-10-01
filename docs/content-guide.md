# Guia de conteúdo do flagx

Como escrever (e revisar) as dicas de `data/countries/<id>.json`.

## Formato

```json
{
  "id": "br",
  "flagDifficulty": 1,
  "hints": [
    { "id": "br-01", "text": "A seleção é filiada à CONMEBOL.", "category": "confederacao", "level": 1, "reviewed": false }
  ]
}
```

- `id` igual ao nome do arquivo e ao `id` em `data/members.json`.
- **10 dicas**, **2 por nível** (1 a 5), ids `<id>-01` a `<id>-10` em ordem.
- `reviewed: false` em tudo que for gerado. Quem revisar corrige o texto e troca para `true`.
- Rode `pnpm validate` depois de editar.

## Níveis

O jogo mostra uma dica de cada nível, do 1 ao 5. Cada nível precisa ser mais revelador que o anterior.

| Nível | O que vai | Exemplo |
|---|---|---|
| 1 | Vago: confederação, estatística genérica, curiosidade ampla | "A seleção é filiada à CAF." |
| 2 | Histórico em Copas, títulos continentais | "Disputou duas Copas do Mundo." |
| 3 | Clubes, estádios, rivalidades, apelido da seleção | "Os torcedores chamam a seleção de 'Pharaohs'." |
| 4 | Jogadores conhecidos, momentos marcantes | "Mohamed Salah defende esta seleção." |
| 5 | O maior ídolo ou o fato mais icônico — quase entrega | "É o maior campeão da Copa Africana de Nações." |

## Futebol primeiro

Use futebol sempre que houver material verdadeiro e interessante. Quando faltar (seleções minúsculas, países e territórios fora da FIFA), complete com:

| Categoria | Quando usar | Exemplo |
|---|---|---|
| `esporte` | Outros esportes: rugby, críquete, atletismo, Olimpíadas, F1 | "Sedia um Grande Prêmio de Fórmula 1 nas ruas do país." |
| `cultura` | Música, culinária, festas, idioma, tradições, religião | "É sede da Igreja Católica." |
| `historia` | Fatos históricos marcantes | "Foi palco de uma guerra em 1982." |
| `geografia` | **Só nos níveis 4 e 5** — capital, localização, fronteiras, clima | "Fica no Atlântico Sul, perto da Argentina." |

Categorias de futebol: `jogador`, `titulo`, `copa`, `clube`, `rivalidade`, `confederacao`, `momento`, `curiosidade` (curiosidade de futebol).

Para lugares fora da FIFA, a dica de nível 1 pode dizer que o lugar **não é filiado à FIFA** (categoria `confederacao`), e o futebol que existir (ligas locais, Island Games, seleções não oficiais, clubes que jogam em ligas de outro país) vem antes dos outros temas.

## Regras de texto

- **Nunca** escreva o nome do lugar, um apelido do `members.json` ou um **gentílico** ("senegalês", "peruanos", "galês", "monegasco"). Use "este país", "esta seleção", "este território", "a ilha".
- Pode citar outros países ("perdeu para a Argentina").
- **Só fatos de que você tem alta confiança.** Na dúvida, troque por outro fato. Prefira fatos históricos estáveis.
- Evite o que muda rápido (técnico atual, "jogador em atividade", ranking atual). Se o fato for recente, date: "Até 2026, …".
- Frases curtas, em português do Brasil, terminando com ponto.
- Varie as categorias: não repita a mesma categoria nas duas dicas de um nível, quando der.

## `flagDifficulty`

Quão fácil é reconhecer **a bandeira** para um brasileiro que acompanha futebol de forma casual:

| Valor | Significado | Exemplos |
|---|---|---|
| 1 | Icônica | Brasil, Argentina, França, Alemanha |
| 2 | Bem conhecida | Portugal, Japão, Holanda, México |
| 3 | Conhecida por quem acompanha futebol | Croácia, Marrocos, Coreia do Sul |
| 4 | Difícil | Senegal, Paraguai, Escócia |
| 5 | Muito difícil ou confundível | Tuvalu, Chade, Niue |

## Publicação

Publique conteúdo novo logo depois da meia-noite de Brasília: mudar o conjunto de países muda o desafio diário a partir do dia do deploy.
