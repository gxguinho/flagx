import { useMemo, useState } from 'react'

import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { searchMembers } from '@/game/normalize'
import type { Member } from '@/game/types'
import { cn } from '@/lib/utils'

interface GuessInputProps {
  members: Member[]
  /** Países já chutados: aparecem riscados e não podem ser escolhidos */
  excludedIds: string[]
  onGuess(id: string): void
  disabled?: boolean
}

export function GuessInput({ members, excludedIds, onGuess, disabled }: GuessInputProps) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchMembers(query, members), [query, members])

  const choose = (id: string) => {
    if (excludedIds.includes(id)) return
    onGuess(id)
    setQuery('')
  }

  return (
    <Command shouldFilter={false} className="h-auto rounded-xl! border bg-card">
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Digite o país..."
        aria-label="Seu palpite"
        disabled={disabled}
        autoComplete="off"
      />
      {query.trim() && (
        <CommandList>
          <CommandEmpty>Nenhum país encontrado</CommandEmpty>
          {results.map((member) => {
            const excluded = excludedIds.includes(member.id)
            return (
              <CommandItem
                key={member.id}
                value={member.id}
                disabled={excluded}
                onSelect={() => choose(member.id)}
                className={cn(excluded && 'line-through')}
              >
                <span className={cn('fi shrink-0 rounded-[2px]', `fi-${member.id}`)} aria-hidden />
                {member.name}
              </CommandItem>
            )
          })}
        </CommandList>
      )}
    </Command>
  )
}
