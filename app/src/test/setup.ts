import '@testing-library/jest-dom/vitest'

// jsdom has no ResizeObserver; MUI X charts (HardwareChart) autosize through
// it and would render empty in tests. Fire once with a fixed desktop size so
// charts lay out synchronously.
class ResizeObserverMock {
  private readonly callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }

  observe(target: Element) {
    const entry = { target, contentRect: { width: 1024, height: 380 } } as unknown as ResizeObserverEntry
    this.callback([entry], this as unknown as ResizeObserver)
  }

  unobserve() {}

  disconnect() {}
}

if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
}
