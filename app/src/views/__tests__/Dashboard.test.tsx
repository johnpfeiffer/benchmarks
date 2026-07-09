import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { theme } from '../../theme'
import { Dashboard } from '../Dashboard'
import { sortModels, nextSortState, DEFAULT_SORT, type ModelEntry, type SortField, type SortState } from '../../models'

const entries: ModelEntry[] = [
  { model: 'Alpha', score: 60, provider: 'Anthropic', reasoning: true },
  { model: 'Beta', score: 50, provider: 'OpenAI', reasoning: false },
  { model: 'Gamma', score: 55, provider: 'Google', reasoning: true },
]

/** Controller stand-in mirroring App.tsx: owns sort state, feeds sorted rows. */
function DashboardController({ initialSort = DEFAULT_SORT }: { initialSort?: SortState }) {
  const [sort, setSort] = useState<SortState>(initialSort)
  const sorted = sortModels(entries, sort)
  const handleSortChange = (field: SortField) => setSort((cur) => nextSortState(cur, field))
  return <Dashboard entries={sorted} sort={sort} onSortChange={handleSortChange} />
}

function renderDashboard(initialSort?: SortState) {
  return render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DashboardController initialSort={initialSort} />
    </ThemeProvider>,
  )
}

describe('Dashboard', () => {
  it('renders the heading and the data-source credit', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: /AI Model Benchmarks/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Artificial Analysis/i })).toHaveAttribute(
      'href',
      'https://artificialanalysis.ai/',
    )
  })

  it('shows all rows in the table', () => {
    renderDashboard()
    expect(screen.getByRole('cell', { name: 'Alpha' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Beta' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Gamma' })).toBeInTheDocument()
  })

  it('defaults to score descending (highest first)', () => {
    renderDashboard()
    const rows = screen.getAllByRole('row')
    // Row 0 is the header; first data row should be the 60-score model.
    expect(rows[1].textContent).toContain('Alpha')
    expect(rows[rows.length - 1].textContent).toContain('Beta')
  })

  it('sorts by Provider ascending when the Provider header is clicked', () => {
    renderDashboard()
    fireEvent.click(screen.getByRole('button', { name: /Provider/i }))
    const rows = screen.getAllByRole('row')
    // Ascending provider order: Anthropic, Google, OpenAI.
    expect(rows[1].textContent).toContain('Anthropic')
    expect(rows[rows.length - 1].textContent).toContain('OpenAI')
  })

  it('toggles Provider to descending on a second click', () => {
    renderDashboard()
    const header = screen.getByRole('button', { name: /Provider/i })
    fireEvent.click(header) // asc
    fireEvent.click(header) // desc
    const rows = screen.getAllByRole('row')
    expect(rows[1].textContent).toContain('OpenAI')
    expect(rows[rows.length - 1].textContent).toContain('Anthropic')
  })
})
