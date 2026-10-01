import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Toaster } from '@/components/ui/sonner'

import { ShareButton } from './ShareButton'

function stub(name: 'share' | 'clipboard', value: unknown) {
  Object.defineProperty(navigator, name, { value, configurable: true, writable: true })
}

/** Simula celular (ponteiro grosso) ou desktop (mouse) */
function pointer(kind: 'coarse' | 'fine') {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: query === '(pointer: coarse)' && kind === 'coarse',
        media: query,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
      }) as unknown as MediaQueryList,
  )
}

afterEach(() => {
  stub('share', undefined)
  stub('clipboard', undefined)
  vi.restoreAllMocks()
})

const renderButton = () =>
  render(
    <>
      <ShareButton text="flagx #1" />
      <Toaster />
    </>,
  )

describe('ShareButton', () => {
  it('usa o compartilhamento nativo no celular', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    stub('share', share)
    pointer('coarse')
    renderButton()
    fireEvent.click(screen.getByRole('button', { name: /Compartilhar/ }))
    await waitFor(() => expect(share).toHaveBeenCalledWith({ text: 'flagx #1' }))
  })

  it('copia o texto e avisa quando não há compartilhamento nativo', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stub('clipboard', { writeText })
    renderButton()
    fireEvent.click(screen.getByRole('button', { name: /Compartilhar/ }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('flagx #1'))
    expect(await screen.findByText('Copiado!')).toBeInTheDocument()
  })

  it('não copia quando o jogador cancela o compartilhamento', async () => {
    const share = vi.fn().mockRejectedValue(Object.assign(new Error('cancelado'), { name: 'AbortError' }))
    const writeText = vi.fn()
    stub('share', share)
    pointer('coarse')
    stub('clipboard', { writeText })
    renderButton()
    fireEvent.click(screen.getByRole('button', { name: /Compartilhar/ }))
    await waitFor(() => expect(share).toHaveBeenCalled())
    expect(writeText).not.toHaveBeenCalled()
  })

  it('copia no desktop mesmo quando o navegador tem compartilhamento nativo', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const writeText = vi.fn().mockResolvedValue(undefined)
    stub('share', share)
    stub('clipboard', { writeText })
    pointer('fine')
    renderButton()
    fireEvent.click(screen.getByRole('button', { name: /Compartilhar/ }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('flagx #1'))
    expect(share).not.toHaveBeenCalled()
  })
})
