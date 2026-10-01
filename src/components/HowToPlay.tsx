import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface HowToPlayProps {
  open: boolean
  onOpenChange(open: boolean): void
}

export function HowToPlay({ open, onOpenChange }: HowToPlayProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Como jogar</DialogTitle>
          <DialogDescription>Descubra o país da bandeira. As dicas são todas sobre futebol.</DialogDescription>
        </DialogHeader>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
          <li>Você tem até 6 tentativas: a primeira só com a bandeira.</li>
          <li>Cada erro libera uma nova dica: jogadores, títulos, Copas, clubes, rivalidades…</li>
          <li>As dicas começam vagas e vão ficando mais reveladoras.</li>
          <li>
            Pontos por acerto: 1000 de primeira, depois 800, 600, 400, 250 e 100. Errou as 6, zero.
          </li>
          <li>No modo fácil você escolhe entre 4 opções, e os pontos valem metade.</li>
          <li>
            O desafio diário tem 5 bandeiras, da mais fácil à mais difícil, iguais para todo mundo. Ele muda à
            meia-noite de Brasília.
          </li>
          <li>No modo livre você joga quantas rodadas quiser.</li>
        </ul>
      </DialogContent>
    </Dialog>
  )
}
