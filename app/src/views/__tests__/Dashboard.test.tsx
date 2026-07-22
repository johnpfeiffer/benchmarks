import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { useState } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { theme } from '../../theme'
import { Dashboard } from '../Dashboard'
import {
  sortModels,
  nextSortState,
  openWeightIds,
  sortNewsDescending,
  DEFAULT_SORT,
  type ModelEntry,
  type NewsItem,
  type SortField,
  type SortState,
} from '../../models'

const entries: ModelEntry[] = [
  {
    id: 'anthropic:alpha',
    model: 'Alpha',
    score: 60,
    provider: 'Anthropic',
    reasoning: true,
    open_weight: true,
    tasteful_solve_rate_pct: 29.1,
    basic_solve_rate_pct: 46.5,
    avg_steps: 159,
    avg_tokens: '290.2K',
  },
  { id: 'openai:beta', model: 'Beta', score: 50, provider: 'OpenAI', reasoning: false, open_weight: false },
  { id: 'google:gamma', model: 'Gamma', score: 55, provider: 'Google', reasoning: true, open_weight: false },
]

const sweChartEntries: ModelEntry[] = [
  {
    id: 'anthropic:alpha:mini-swe-agent:max',
    model: 'Alpha',
    score: 29.1,
    provider: 'Anthropic',
    open_weight: true,
    tasteful_solve_rate_pct: 29.1,
    basic_solve_rate_pct: 46.5,
    avg_steps: 159,
    avg_tokens: '290.2K',
  },
]

const testNewsItems: NewsItem[] = sortNewsDescending([
  { url: 'https://example.com/older-article', date: '2026-07-20' },
  { url: 'https://example.com/newer-article', date: '2026-07-26' },
])

/** Controller stand-in mirroring App.tsx: owns sort state, feeds sorted rows. */
function DashboardController({ initialSort = DEFAULT_SORT }: { initialSort?: SortState }) {
  const [sort, setSort] = useState<SortState>(initialSort)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(entries.map((entry) => entry.id)))
  const [openWeightsOnly, setOpenWeightsOnly] = useState(false)
  const sorted = sortModels(entries, sort)
  const chartEntries = sorted.filter((entry) => selectedIds.has(entry.id))
  const handleSortChange = (field: SortField) => setSort((cur) => nextSortState(cur, field))
  const handleToggleEntry = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const handleToggleOpenWeights = () => {
    if (openWeightsOnly) {
      setSelectedIds(new Set(entries.map((entry) => entry.id)))
      setOpenWeightsOnly(false)
    } else {
      setSelectedIds(openWeightIds(entries))
      setOpenWeightsOnly(true)
    }
  }
  return (
    <Dashboard
      entries={sorted}
      intelligenceChartEntries={chartEntries}
      tastefulSweChartEntries={sweChartEntries.filter((entry) => selectedIds.has(`anthropic:${entry.model.toLowerCase()}`))}
      basicSweChartEntries={sweChartEntries
        .filter((entry) => selectedIds.has(`anthropic:${entry.model.toLowerCase()}`))
        .map((entry) => ({ ...entry, id: `${entry.id}:basic`, score: entry.basic_solve_rate_pct ?? entry.score }))}
      sort={sort}
      selectedIds={selectedIds}
      onSortChange={handleSortChange}
      onToggleEntry={handleToggleEntry}
      openWeightsOnly={openWeightsOnly}
      onToggleOpenWeights={handleToggleOpenWeights}
      sources={[
        { label: 'Artificial Analysis', href: 'https://artificialanalysis.ai/' },
        { label: 'Senior SWE Bench', href: 'https://senior-swe-bench.snorkel.ai/' },
      ]}
      newsItems={testNewsItems}
    />
  )
}

function renderDashboard(initialSort?: SortState) {
  return render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DashboardController initialSort={initialSort} />
    </ThemeProvider>,
  )
}

function intelligenceTable() {
  return screen.getByRole('table', { name: 'Model Details' })
}

describe('Dashboard', () => {
  it('renders the heading and the data-source credit', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: /AI Model Benchmarks/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Artificial Analysis/i })[0]).toHaveAttribute(
      'href',
      'https://artificialanalysis.ai/',
    )
    expect(screen.getByRole('link', { name: /Senior SWE Bench/i })).toHaveAttribute(
      'href',
      'https://senior-swe-bench.snorkel.ai/',
    )
    const githubLink = screen.getByRole('link', { name: /GitHub repository/i })
    expect(githubLink).toHaveAttribute('href', 'https://github.com/johnpfeiffer/benchmarks')
    expect(githubLink.querySelector('svg')).toBeInTheDocument()
  })

  it('renders both benchmark sections', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: 'Artificial Analysis Intelligence' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Senior SWE Bench' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tasteful Solve Rate' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Basic Solve Rate' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Intelligence Score' })).not.toBeInTheDocument()
  })

  it('renders the SWE metric columns in the existing table', () => {
    renderDashboard()
    const table = intelligenceTable()
    expect(within(table).getByRole('button', { name: /Intelligence/i })).toBeInTheDocument()
    expect(within(table).getByRole('button', { name: /tasteful_solve_rate_pct/i })).toBeInTheDocument()
    expect(within(table).getByRole('button', { name: /basic_solve_rate_pct/i })).toBeInTheDocument()
    expect(within(table).getByRole('button', { name: /avg_steps/i })).toBeInTheDocument()
    expect(within(table).getByRole('button', { name: /avg_tokens/i })).toBeInTheDocument()
  })

  it('shows all rows in the table', () => {
    renderDashboard()
    expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Beta' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gamma' })).toBeInTheDocument()
  })

  it('shows SWE metric values and placeholders for missing values', () => {
    renderDashboard()
    const rows = within(intelligenceTable()).getAllByRole('row')
    expect(rows[1].textContent).toContain('29.1')
    expect(rows[1].textContent).toContain('46.5')
    expect(rows[1].textContent).toContain('159')
    expect(rows[1].textContent).toContain('290.2K')
    expect(rows[rows.length - 1].textContent).toContain('*')
  })

  it('defaults to score descending (highest first)', () => {
    renderDashboard()
    const rows = within(intelligenceTable()).getAllByRole('row')
    // Row 0 is the header; first data row should be the 60-score model.
    expect(rows[1].textContent).toContain('Alpha')
    expect(rows[rows.length - 1].textContent).toContain('Beta')
  })

  it('sorts by Provider ascending when the Provider header is clicked', () => {
    renderDashboard()
    fireEvent.click(within(intelligenceTable()).getByRole('button', { name: /Provider/i }))
    const rows = within(intelligenceTable()).getAllByRole('row')
    // Ascending provider order: Anthropic, Google, OpenAI.
    expect(rows[1].textContent).toContain('Anthropic')
    expect(rows[rows.length - 1].textContent).toContain('OpenAI')
  })

  it('toggles Provider to descending on a second click', () => {
    renderDashboard()
    const header = within(intelligenceTable()).getByRole('button', { name: /Provider/i })
    fireEvent.click(header) // asc
    fireEvent.click(header) // desc
    const rows = within(intelligenceTable()).getAllByRole('row')
    expect(rows[1].textContent).toContain('OpenAI')
    expect(rows[rows.length - 1].textContent).toContain('Anthropic')
  })

  it('toggles model selection from the model-name button', () => {
    renderDashboard()
    const alpha = screen.getByRole('button', { name: 'Alpha' })
    expect(alpha).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(alpha)
    expect(alpha).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows an empty chart state after every model is deselected', () => {
    renderDashboard()
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }))
    fireEvent.click(screen.getByRole('button', { name: 'Beta' }))
    fireEvent.click(screen.getByRole('button', { name: 'Gamma' }))
    expect(screen.getAllByText('No models selected')).toHaveLength(3)
  })

  it('renders the "Open Weights Only" toggle beside the Model Details title, off by default', () => {
    renderDashboard()
    const toggle = screen.getByRole('button', { name: 'Open Weights Only' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  it('sets selection to open-weight models when "Open Weights Only" is toggled on', () => {
    renderDashboard()
    const toggle = screen.getByRole('button', { name: 'Open Weights Only' })
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    // Only Alpha is open-weight -> stays selected; Beta and Gamma deselected.
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Gamma' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('re-selects every model when "Open Weights Only" is toggled back off', () => {
    renderDashboard()
    const toggle = screen.getByRole('button', { name: 'Open Weights Only' })
    fireEvent.click(toggle) // on
    fireEvent.click(toggle) // off
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Gamma' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders the source as a chip linking to Artificial Analysis', () => {
    renderDashboard()
    const chip = screen.getByRole('link', { name: /Source: Artificial Analysis/i })
    expect(chip).toHaveAttribute('href', 'https://artificialanalysis.ai/')
    expect(chip).toHaveAttribute('target', '_blank')
  })

  it('renders the News section heading below the intelligence chart', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: 'News' })).toBeInTheDocument()
  })

  it('starts the News section expanded with links visible', () => {
    renderDashboard()
    // Expanded by default: links are in the accessibility tree.
    expect(screen.getByRole('link', { name: 'https://example.com/newer-article' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'https://example.com/older-article' })).toBeInTheDocument()
  })

  it('shows the article date on hover via the title attribute', () => {
    renderDashboard()
    const newer = screen.getByRole('link', { name: 'https://example.com/newer-article' })
    const older = screen.getByRole('link', { name: 'https://example.com/older-article' })
    expect(newer).toHaveAttribute('title', '2026-07-26')
    expect(older).toHaveAttribute('title', '2026-07-20')
  })

  it('sorts news items descending so the newest article is first', () => {
    renderDashboard()
    const newsLinks = screen.getAllByRole('link', { name: /example\.com\/(newer|older)-article/ })
    expect(newsLinks[0]).toHaveAttribute('href', 'https://example.com/newer-article')
    expect(newsLinks[1]).toHaveAttribute('href', 'https://example.com/older-article')
  })

  it('collapses the News section when the summary is clicked', () => {
    renderDashboard()
    const summaryButton = screen.getByRole('button', { name: /News/ })
    expect(summaryButton).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(summaryButton)
    expect(summaryButton).toHaveAttribute('aria-expanded', 'false')
  })
})
