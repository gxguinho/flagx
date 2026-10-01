// Valida data/ antes do build. Roda com o suporte nativo a TypeScript do Node (>= 22.18).
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

import { validateDataset } from '../src/data/validate.ts'

const root = join(import.meta.dirname, '..')
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'))

const countriesDir = join(root, 'data', 'countries')
const contents: Record<string, unknown> = {}
for (const file of readdirSync(countriesDir).filter((f) => f.endsWith('.json'))) {
  contents[basename(file, '.json')] = readJson(join(countriesDir, file))
}

const members = readJson(join(root, 'data', 'members.json'))
const flagExists = (id: string) => existsSync(join(root, 'node_modules', 'flag-icons', 'flags', '4x3', `${id}.svg`))

const errors = validateDataset({ members, contents, flagExists })
if (errors.length > 0) {
  console.error(`✗ ${errors.length} erro(s) nos dados:`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log(`✓ ${(members as unknown[]).length} membros, ${Object.keys(contents).length} países válidos`)
