import { vi } from 'vitest'

/**
 * MUI X v9 measures the chart container via getComputedStyle, which jsdom
 * cannot lay out (percentages resolve to 0), so axes and bar labels never
 * render in tests. Pin a concrete canvas size for the duration of a test;
 * pair with the ResizeObserver mock in setup.ts. Same pattern as
 * HardwareChart.test.tsx — call the returned restore in a finally/afterEach.
 */
export function pinChartCanvas(width = '1024px', height = '380px'): () => void {
  const real = window.getComputedStyle.bind(window)
  const spy = vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element, pseudoElt?: string | null) => {
    const style = real(element, pseudoElt)
    const w = Number.parseFloat(style.width)
    const h = Number.parseFloat(style.height)
    if (!Number.isFinite(w) || style.width.endsWith('%')) {
      Object.defineProperty(style, 'width', { value: width, configurable: true })
    }
    if (!Number.isFinite(h) || style.height.endsWith('%')) {
      Object.defineProperty(style, 'height', { value: height, configurable: true })
    }
    return style
  })
  return () => spy.mockRestore()
}
