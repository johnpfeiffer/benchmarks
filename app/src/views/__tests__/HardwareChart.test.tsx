import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { HardwareChart } from '../HardwareChart'
import type { HardwareEntry } from '../../models'

const entries: HardwareEntry[] = [
  // One trillion-param giant whose tallest bar exceeds the axis cap...
  { model: 'Huge 2.8T', provider: 'A', total_params: '2.8T', iq1_m_gb: 649, q2_k_xl_gb: 861, q4_k_xl_gb: 1510, url: 'https://example.com/huge', intelligence_score: 60 },
  // ...next to small models whose bars must stay visible.
  { model: 'Small 31B', provider: 'B', total_params: '31B', iq1_m_gb: 11, q2_k_xl_gb: 12, q4_k_xl_gb: 19, url: 'https://example.com/small', intelligence_score: null },
]

// MUI X v9 measures the chart container via getComputedStyle, which jsdom
// cannot lay out (percentages resolve to 0). Force a concrete canvas size so
// the axes render; see also the ResizeObserver mock in src/test/setup.ts.
const realGetComputedStyle = window.getComputedStyle.bind(window)

beforeEach(() => {
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element, pseudoElt?: string | null) => {
    const style = realGetComputedStyle(element, pseudoElt)
    const width = Number.parseFloat(style.width)
    const height = Number.parseFloat(style.height)
    if (!Number.isFinite(width) || style.width.endsWith('%')) {
      Object.defineProperty(style, 'width', { value: '1024px', configurable: true })
    }
    if (!Number.isFinite(height) || style.height.endsWith('%')) {
      Object.defineProperty(style, 'height', { value: '380px', configurable: true })
    }
    return style
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('HardwareChart', () => {
  it('caps the size axis at 1,500 GB so smaller models stay visible', () => {
    const { container } = render(<HardwareChart entries={entries} />)
    // The only numeric text in the chart is the y-axis tick labels (the
    // x-axis carries model names and no bar value labels are enabled).
    const ticks = [...container.querySelectorAll('text')]
      .map((node) => Number(node.textContent?.replace(/,/g, '')))
      .filter((value) => !Number.isNaN(value))
    expect(ticks.length).toBeGreaterThan(0)
    expect(Math.max(...ticks)).toBe(1500)
  })
})
