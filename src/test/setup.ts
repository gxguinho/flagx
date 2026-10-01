import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Sem `globals: true`, o Testing Library não limpa o DOM sozinho entre testes
afterEach(cleanup)

// jsdom não implementa APIs usadas pelo cmdk e pelo Radix
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Element.prototype.scrollIntoView ??= function () {}
