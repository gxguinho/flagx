// Quantas dicas já foram revisadas, por país.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { CountryContent } from '../src/game/types.ts'

const dir = join(import.meta.dirname, '..', 'data', 'countries')
let reviewed = 0
let total = 0
for (const file of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  const content = JSON.parse(readFileSync(join(dir, file), 'utf8')) as CountryContent
  const done = content.hints.filter((h) => h.reviewed).length
  reviewed += done
  total += content.hints.length
  console.log(`${content.id.padEnd(8)} ${done}/${content.hints.length}`)
}
console.log(`\nTotal: ${reviewed}/${total} dicas revisadas`)
