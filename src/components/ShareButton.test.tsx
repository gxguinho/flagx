import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Toaster } from '@/components/ui/sonner'

import { ShareButton } from './ShareButton'

function stub(name: 'share' | 'clipboard', value: unknown) {
  Object.defineProperty(navigator, name, { value, configurable: true, writable: true })
}

afterEach(() => {
  stub('share', undefined)
  stub('clipboard', undefined)
})

const renderButton = () =>
  render(
    <>
      <ShareButton text="flagx #1" />
      <Toaster />
    </>,
  )

describe('ShareButton', () => {
  it('usa o compartilhamento nativo quando existe', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    stub('share', share)
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
    stub('clipboard', { writeText })
    renderButton()
    fireEvent.click(screen.getByRole('button', { name: /Compartilhar/ }))
    await waitFor(() => expect(share).toHaveBeenCalled())
    expect(writeText).not.toHaveBeenCalled()
  })
})
