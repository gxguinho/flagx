import { Button } from '@/components/ui/button'
import type { Member } from '@/game/types'

interface ChoiceGridProps {
  choices: Member[]
  wrongIds: string[]
  onGuess(id: string): void
  disabled?: boolean
}

export function ChoiceGrid({ choices, wrongIds, onGuess, disabled }: ChoiceGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {choices.map((member) => {
        const wrong = wrongIds.includes(member.id)
        return (
          <Button
            key={member.id}
            size="lg"
            variant={wrong ? 'destructive' : 'outline'}
            disabled={disabled || wrong}
            onClick={() => onGuess(member.id)}
            className="h-auto min-h-11 whitespace-normal py-2"
          >
            {member.name}
          </Button>
        )
      })}
    </div>
  )
}
