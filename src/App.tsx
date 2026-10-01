import { BarChart3, CalendarDays, CircleHelp, Infinity as InfinityIcon } from 'lucide-react'
import { useState } from 'react'

import { Flag } from '@/components/Flag'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DailyScreen } from '@/screens/DailyScreen'
import { FreeScreen } from '@/screens/FreeScreen'
import { useSave } from '@/state/useSave'

export type Screen = 'home' | 'daily' | 'free' | 'stats'

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [save, updateSave] = useSave()
  const goHome = () => setScreen('home')

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col px-4 py-6">
      {screen === 'daily' && <DailyScreen save={save} updateSave={updateSave} onBack={goHome} />}
      {screen === 'free' && <FreeScreen save={save} updateSave={updateSave} onBack={goHome} />}

      {screen === 'home' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <header className="text-center">
            <h1 className="text-5xl font-bold tracking-tight">
              flag<span className="text-primary">x</span>
            </h1>
            <p className="mt-2 text-muted-foreground">Descubra o país através do futebol.</p>
          </header>

          <Card className="w-full max-w-64">
            <CardContent>
              <Flag code="br" />
            </CardContent>
          </Card>

          <nav className="flex w-full flex-col gap-3">
            <Button size="lg" onClick={() => setScreen('daily')}>
              <CalendarDays /> Desafio diário
            </Button>
            <Button size="lg" variant="outline" onClick={() => setScreen('free')}>
              <InfinityIcon /> Modo livre
            </Button>
            <Button size="lg" variant="outline" disabled>
              <BarChart3 /> Estatísticas
            </Button>
            <Button size="lg" variant="ghost" disabled>
              <CircleHelp /> Como jogar
            </Button>
          </nav>
        </div>
      )}
    </main>
  )
}

export default App
