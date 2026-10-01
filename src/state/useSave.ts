import { useCallback, useState } from 'react'

import { loadSave, writeSave, type SaveData } from '@/storage/storage'

export type UpdateSave = (update: (prev: SaveData) => SaveData) => void

/** Estado salvo no localStorage; cada atualização é gravada na hora */
export function useSave(): [SaveData, UpdateSave] {
  const [save, setSave] = useState(() => loadSave())
  const update = useCallback<UpdateSave>((fn) => {
    setSave((prev) => {
      const next = fn(prev)
      writeSave(next)
      return next
    })
  }, [])
  return [save, update]
}
