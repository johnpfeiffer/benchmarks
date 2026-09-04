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
    series: Array<{ barLabel?: string }>
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

  it('leaves bar labels off by default (SWE charts stay unlabeled)', () => {
    const props = renderChart()
    expect(props.series[0].barLabel).toBeUndefined()
    expect(props.sx?.['& .MuiBarChart-label']).toBeUndefined()
    // Grid styles are always present
    expect(props.sx?.['& .MuiChartsGrid-line']).toBeDefined()
  })
})
