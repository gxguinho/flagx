import { useState } from 'react'

import { HowToPlay } from '@/components/HowToPlay'
import { dateKey, puzzleNumber } from '@/game/daily'
import { DailyScreen } from '@/screens/DailyScreen'
import { dailyStatus } from '@/screens/dailyStatus'
import { FreeScreen } from '@/screens/FreeScreen'
import { Home } from '@/screens/Home'
import { StatsScreen } from '@/screens/StatsScreen'
import { useSave } from '@/state/useSave'

export type Screen = 'home' | 'daily' | 'free' | 'stats'

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [helpOpen, setHelpOpen] = useState(false)
  const [save, updateSave] = useSave()
  // Data de referência do início; renovada ao voltar, para pegar a virada do dia
  const [today, setToday] = useState(() => new Date())
  const goHome = () => {
    setToday(new Date())
    setScreen('home')
  }
  const puzzle = puzzleNumber(dateKey(today))

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col px-4 py-6">
      {screen === 'home' && (
        <Home
          puzzle={puzzle}
          status={dailyStatus(save, puzzle)}
          onDaily={() => setScreen('daily')}
          onFree={() => setScreen('free')}
          onStats={() => setScreen('stats')}
          onHelp={() => setHelpOpen(true)}
        />
      )}
      {screen === 'daily' && <DailyScreen save={save} updateSave={updateSave} onBack={goHome} />}
      {screen === 'free' && <FreeScreen save={save} updateSave={updateSave} onBack={goHome} />}
      {screen === 'stats' && <StatsScreen save={save} onBack={goHome} />}
      <HowToPlay open={helpOpen} onOpenChange={setHelpOpen} />
    </main>
  )
}

export default App
