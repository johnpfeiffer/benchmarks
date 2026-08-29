import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ThemeProvider } from '@mui/material'
import { theme } from '../../theme'
import { IntelligenceBarChart } from '../IntelligenceBarChart'
import type { ModelEntry } from '../../models'

const entries: ModelEntry[] = [
  { id: 'anthropic:alpha', model: 'Alpha', score: 60, provider: 'Anthropic', open_weight: true },
  { id: 'openai:beta', model: 'Beta', score: 50, provider: 'OpenAI', open_weight: false },
]

function renderChart(fitWidth = false) {
  return render(
    <ThemeProvider theme={theme}>
      <IntelligenceBarChart entries={entries} scoreLabel="Score" fitWidth={fitWidth} />
    </ThemeProvider>,
  )
}

/** All CSS text emotion has injected into the document. */
function injectedCss(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((style) => style.textContent ?? '')
    .join('\n')
}

describe('IntelligenceBarChart', () => {
  it('wraps the wide chart in a horizontally scrollable container that allows touch panning', () => {
    const { container } = renderChart()
    const layer = container.querySelector('[class*="MuiChartsLayerContainer"]')
    expect(layer).not.toBeNull()
    // The override selector must actually match the layer container: MUI X v9
    // gives it only an emotion-labeled class (css-*-MuiChartsLayerContainer-root),
    // no literal MuiChartsLayerContainer-root class.
    expect(layer!.matches('[class*="MuiChartsLayerContainer-root"]')).toBe(true)
    const css = injectedCss()
    // The wide chart scrolls horizontally (mobile regression: MUI X v9 sets
    // touch-action: pan-y on its layer container, which used to block
    // horizontal touch scrolling of the overflow container).
    expect(css).toContain('overflow-x:auto')
    expect(css).toMatch(/\[class\*=["']?MuiChartsLayerContainer-root["']?\]\{[^}]*touch-action:pan-x pan-y/)
    // Behavioral check: the computed style reflects the override.
    expect(getComputedStyle(layer!).touchAction).toBe('pan-x pan-y')
  })
})
