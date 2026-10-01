import { Share2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

async function shareText(text: string) {
  if (navigator.share) {
    try {
      await navigator.share({ text })
      return
    } catch (error) {
      // Jogador fechou a janela de compartilhamento: nada a fazer
      if (error instanceof Error && error.name === 'AbortError') return
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    toast('Copiado!')
  } catch {
    toast('Não foi possível copiar o resultado')
  }
}

export function ShareButton({ text }: { text: string }) {
  return (
    <Button size="lg" onClick={() => void shareText(text)}>
      <Share2 /> Compartilhar
    </Button>
  )
}
