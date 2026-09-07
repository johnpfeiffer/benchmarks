import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material'
import { theme } from '../../theme'
import { IntelligenceBarChart } from '../IntelligenceBarChart'
import type { ModelEntry } from '../../models'

/**
 * jsdom has no layout engine, so MUI X Charts never draws bars or labels in
 * tests. Instead of asserting on SVG output, capture the props handed to
 * <BarChart> and check the label configuration directly.
 */
const lastBarChartProps = vi.hoisted(() => ({ current: null as Record<string, unknown> | null }))

vi.mock('@mui/x-charts/BarChart', () => ({
  BarChart: (props: Record<string, unknown>) => {
    lastBarChartProps.current = props
    return <div data-testid="bar-chart" />
  },
}))

const entries: ModelEntry[] = [
  { id: 'anthropic:alpha', model: 'Alpha', score: 60, provider: 'Anthropic', open_weight: false, released: null, color: '#cc785c' },
]

function renderChart(barValues?: boolean) {
  render(
    <ThemeProvider theme={theme}>
      <IntelligenceBarChart entries={entries} scoreLabel="Score" barValues={barValues} />
    </ThemeProvider>,
  )
  return lastBarChartProps.current as {
    series: Array<{ barLabel?: string; barLabelPlacement?: string }>
    sx?: Record<string, { fill?: string }>
  }
}

describe('IntelligenceBarChart value labels', () => {
  it('shows scores above bars when barValues is on', () => {
    const props = renderChart(true)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(props.series[0].barLabel).toBe('value')
    expect(props.series[0].barLabelPlacement).toBe('outside')
    expect(props.sx?.['& .MuiBarChart-label']).toBeDefined()
  })

  it('leaves bar labels off by default', () => {
    const props = renderChart()
    expect(props.series[0].barLabel).toBeUndefined()
    expect(props.sx?.['& .MuiBarChart-label']).toBeUndefined()
    // Grid styles are always present
    expect(props.sx?.['& .MuiChartsGrid-line']).toBeDefined()
  })
})

describe('IntelligenceBarChart mobile touch scrolling', () => {
  function injectedCss(): string {
    const parts: string[] = []
    for (const style of Array.from(document.querySelectorAll('style'))) {
      parts.push(style.textContent ?? '')
      const sheet = style.sheet as CSSStyleSheet | null
      if (sheet) {
        try {
          parts.push(Array.from(sheet.cssRules).map((rule) => rule.cssText).join('\n'))
        } catch {
          // unreadable sheet; textContent already captured
        }
      }
    }
    return parts.join('\n')
  }

  it('keys the touch-action override to the stable MuiChartsSurface-root class', () => {
    // Regression: MUI X sets touch-action: pan-y on its chart layer
    // container, which blocks horizontal touch scrolling of the chart's
    // overflow container. The container's only stable class is
    // MuiChartsSurface-root; the emotion label suffix
    // (css-*-MuiChartsLayerContainer-root) is dropped from production
    // builds, so an attribute selector keyed on it silently stops matching
    // and mobile horizontal scrolling breaks.
    renderChart()
    expect(injectedCss()).toMatch(/\.MuiChartsSurface-root[^{}]*\{[^{}]*touch-action:\s*pan-x pan-y/)
  })
})
