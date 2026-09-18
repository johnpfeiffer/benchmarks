import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { useState } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { theme } from '../../theme'
import { Dashboard } from '../Dashboard'
import { sortModels, nextSortState, openWeightIds, aaVersionsDesc, DEFAULT_SORT, type ModelEntry, type HardwareEntry, type GpuEntry, type MachineEntry, type SortField, type SortState } from '../../models'

const entries: ModelEntry[] = [
  {
    id: 'anthropic:alpha',
    model: 'Alpha',
    score: 60,
    aa_version: 'v9.9',
    provider: 'Anthropic',
    open_weight: true,
    released: '2026-07-01',
    cost_usd: 950,
  },
  // Beta has no measured benchmark cost: its cost cell renders "*".
  { id: 'openai:beta', model: 'Beta', score: 50, aa_version: 'v9.9', provider: 'OpenAI', open_weight: false, released: null },
  { id: 'google:gamma', model: 'Gamma', score: 55, aa_version: 'v9.9', provider: 'Google', open_weight: false, released: '2026-03-15', cost_usd: 1200 },
]

const hardwareEntries: HardwareEntry[] = [
  { model: 'Inkling', provider: 'Thinking Machines', total_params: '264B', iq1_m_gb: 78.8, q2_k_xl_gb: 87.9, q4_k_xl_gb: 163, url: 'https://huggingface.co/unsloth/Inkling-Small-GGUF', intelligence_score: 42 },
  { model: 'Kimi K3', provider: 'Moonshot AI', total_params: '2.8T', iq1_m_gb: 649, q2_k_xl_gb: 861, q4_k_xl_gb: 1510, url: 'https://huggingface.co/unsloth/Kimi-K3-GGUF', intelligence_score: 60 },
  { model: 'Gemma 4 31B', provider: 'Google', total_params: '31B', iq1_m_gb: null, q2_k_xl_gb: 11.8, q4_k_xl_gb: 18.8, url: 'https://huggingface.co/unsloth/gemma-4-31B-it-GGUF', intelligence_score: null },
]

const gpuEntries: GpuEntry[] = [
  { model: 'A100 (SXM)', date: '2020', memory: '40 HBM2e (80* opt)', memory_type: 'HBM2e', memory_bandwidth_gbs: 1555, fp16_tflops: 312 },
  { model: 'H100 (SXM)', date: '2022-10', memory: '80 GB HBM3e', memory_type: 'HBM3e', memory_bandwidth_gbs: 3355, fp16_tflops: 1979 },
  { model: 'L40 (Ada)', date: '2022-11', memory: '48 GB GDDR6', memory_type: 'GDDR6', memory_bandwidth_gbs: 864, fp16_tflops: 1466 },
]

// Deliberately unordered so the default VRAM-descending sort is exercised.
const machineEntries: MachineEntry[] = [
  { machine: 'Mac mini (M6, 2026)', chip: 'Apple M6', vram_gb: 32, memory_bandwidth_gbs: 170, price_usd: 1299, url: 'https://example.com/mac-mini' },
  { machine: 'Mac Studio (M5 Ultra, 2026)', chip: 'Apple M5 Ultra', vram_gb: 256, memory_bandwidth_gbs: 1200, price_usd: 9499, url: 'https://example.com/mac-studio' },
  { machine: 'NVIDIA DGX Spark', chip: 'NVIDIA GB10 Grace Blackwell', vram_gb: 128, memory_bandwidth_gbs: 273, price_usd: 4699, url: 'https://example.com/dgx-spark' },
]

/** Controller stand-in mirroring App.tsx: owns sort + version state, feeds sorted rows. */
function DashboardController({ initialSort = DEFAULT_SORT, allEntries = entries }: { initialSort?: SortState; allEntries?: readonly ModelEntry[] }) {
  const [sort, setSort] = useState<SortState>(initialSort)
  const aaVersions = aaVersionsDesc(allEntries)
  const [aaVersion, setAaVersion] = useState(aaVersions[0])
  const visible = allEntries.filter((entry) => entry.aa_version === aaVersion)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(allEntries.map((entry) => entry.id)))
  const [openWeightsOnly, setOpenWeightsOnly] = useState(false)
  const sorted = sortModels(visible, sort)
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
      setSelectedIds(new Set(visible.map((entry) => entry.id)))
      setOpenWeightsOnly(false)
    } else {
      setSelectedIds(openWeightIds(visible))
      setOpenWeightsOnly(true)
    }
  }
  // Mirror App.tsx: a version switch resets the selection to the shown
  // version's models and clears the Open Weights preset.
  const handleAAVersionChange = (version: string) => {
    setAaVersion(version)
    setOpenWeightsOnly(false)
    setSelectedIds(new Set(allEntries.filter((entry) => entry.aa_version === version).map((entry) => entry.id)))
  }
  return (
    <Dashboard
      entries={sorted}
      intelligenceChartEntries={chartEntries}
      aaVersions={aaVersions}
      aaVersion={aaVersion}
      onAAVersionChange={handleAAVersionChange}
      sort={sort}
      selectedIds={selectedIds}
      onSortChange={handleSortChange}
      onToggleEntry={handleToggleEntry}
      openWeightsOnly={openWeightsOnly}
      onToggleOpenWeights={handleToggleOpenWeights}
      intelligenceSource={{ label: 'Artificial Analysis', href: 'https://artificialanalysis.ai/' }}
      news={[
        { url: 'https://example.com/newest', date: '2026-07-26' },
        { url: 'https://example.com/second', date: '2026-07-24' },
        { url: 'https://example.com/third', date: '2026-07-22' },
        { url: 'https://example.com/older', date: '2026-07-20' },
        { url: 'https://example.com/oldest', date: '2026-07-15' },
      ]}
      hardware={hardwareEntries}
      hardwareSource={{ label: 'HuggingFace', href: 'https://huggingface.co/unsloth' }}
      gpu={gpuEntries}
      gpuSources={[
        { label: 'NVIDIA Hopper Architecture', href: 'https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/' },
        { label: 'NVIDIA RTX Pro 6000', href: 'https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000/' },
        { label: 'NVIDIA H200', href: 'https://www.nvidia.com/en-us/data-center/h200/' },
      ]}
      machines={machineEntries}
      machineSources={[
        { label: 'Daring Fireball: Mac configurations and pricing', href: 'https://daringfireball.net/2026/08/configurations_and_pricing_for_new_mac_minis_and_mac_studios' },
      ]}
      sources={[
        { label: 'Artificial Analysis Intelligence Index v4.3', href: 'https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v4-3' },
      ]}
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

/** Model Details starts collapsed; open it via the accordion summary. */
function expandModelDetails() {
  fireEvent.click(screen.getByRole('button', { name: /Model Details/i }))
}

/** Hand Picked News starts collapsed; open it via the accordion summary. */
function expandNews() {
  fireEvent.click(screen.getByRole('button', { name: /Hand Picked News/i }))
}

describe('Dashboard', () => {
  it('renders the heading and the data-source credit', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: /AI Model Benchmarks/i })).toBeInTheDocument()
    // The Pareto section (collapsed by default) credits the AA homepage; the
    // footer credit names the Intelligence Index version it cites and links to
    // that version's article.
    const paretoSection = screen.getByRole('heading', { name: 'Pareto frontier' }).closest('section') as HTMLElement
    fireEvent.click(within(paretoSection).getByRole('button', { name: 'Pareto frontier' }))
    expect(within(paretoSection).getByRole('link', { name: 'Artificial Analysis' })).toHaveAttribute(
      'href',
      'https://artificialanalysis.ai/',
    )
    const footerCredit = within(screen.getByRole('contentinfo')).getByRole('link', { name: /Artificial Analysis/i })
    expect(footerCredit).toHaveAttribute(
      'href',
      'https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v4-3',
    )
    expect(footerCredit).toHaveTextContent('Intelligence Index v4.3')
    const githubLink = screen.getByRole('link', { name: /GitHub repository/i })
    expect(githubLink).toHaveAttribute('href', 'https://github.com/johnpfeiffer/benchmarks')
    expect(githubLink.querySelector('svg')).toBeInTheDocument()
  })

  it('swaps the chart and table between Intelligence Index versions via the toggle', () => {
    // Two snapshots of Alpha plus a v9.9-only Beta.
    const twoVersions: ModelEntry[] = [
      { id: 'anthropic:alpha', model: 'Alpha', score: 60, aa_version: 'v9.9', provider: 'Anthropic', open_weight: true, released: '2026-07-01' },
      { id: 'anthropic:alpha', model: 'Alpha', score: 66, aa_version: 'v9.8', provider: 'Anthropic', open_weight: true, released: '2026-07-01' },
      { id: 'openai:beta', model: 'Beta', score: 50, aa_version: 'v9.9', provider: 'OpenAI', open_weight: false, released: null },
    ]
    render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DashboardController allEntries={twoVersions} />
      </ThemeProvider>,
    )
    const alphaRow = () => within(intelligenceTable()).getByRole('button', { name: 'Alpha' }).closest('tr') as HTMLElement
    // Newest version shows first; the toggle lives in the Model Details
    // summary and drives both the chart and the table.
    expandModelDetails()
    expect(within(intelligenceTable()).getAllByRole('row')).toHaveLength(3)
    expect(alphaRow().textContent).toContain('60')
    fireEvent.click(screen.getAllByRole('button', { name: 'v9.8' })[0])
    expect(within(intelligenceTable()).getAllByRole('row')).toHaveLength(2)
    expect(alphaRow().textContent).toContain('66')
    expect(within(intelligenceTable()).queryByRole('button', { name: 'Beta' })).not.toBeInTheDocument()
    // Switching back restores the newer snapshot.
    fireEvent.click(screen.getAllByRole('button', { name: 'v9.9' })[0])
    expect(within(intelligenceTable()).getAllByRole('row')).toHaveLength(3)
    expect(alphaRow().textContent).toContain('60')
  })

  it('carries the only version selector in the Model Details summary, driving chart and table without toggling the accordion', () => {
    const twoVersions: ModelEntry[] = [
      { id: 'anthropic:alpha', model: 'Alpha', score: 60, aa_version: 'v9.9', provider: 'Anthropic', open_weight: true, released: '2026-07-01' },
      { id: 'anthropic:alpha', model: 'Alpha', score: 66, aa_version: 'v9.8', provider: 'Anthropic', open_weight: true, released: '2026-07-01' },
    ]
    render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DashboardController allEntries={twoVersions} />
      </ThemeProvider>,
    )
    // One selector page-wide, inside the Model Details summary: with the
    // details table right below the chart, a chart-header selector would be
    // duplicative.
    const groups = screen.getAllByRole('group', { name: 'Intelligence Index version' })
    expect(groups).toHaveLength(1)
    const summary = screen.getByRole('button', { name: /Model Details/i })
    expect(summary.contains(groups[0])).toBe(true)
    const intelSection = screen.getByRole('heading', { name: 'Artificial Analysis Intelligence' }).closest('section') as HTMLElement
    expect(within(intelSection).queryByRole('group', { name: 'Intelligence Index version' })).not.toBeInTheDocument()
    expect(within(groups[0]).getByRole('button', { name: 'v9.9' })).toHaveAttribute('aria-pressed', 'true')

    // Clicking the summary's selector (rendered even while collapsed)
    // switches the version without expanding the accordion.
    expect(summary).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(within(groups[0]).getByRole('button', { name: 'v9.8' }))
    expect(summary).toHaveAttribute('aria-expanded', 'false')
    expect(within(groups[0]).getByRole('button', { name: 'v9.8' })).toHaveAttribute('aria-pressed', 'true')

    // The table follows even though it was toggled from its own summary.
    expandModelDetails()
    expect(within(intelligenceTable()).getAllByRole('row')).toHaveLength(2)
    expect(within(intelligenceTable()).getByRole('button', { name: 'Alpha' }).closest('tr')?.textContent).toContain('66')
  })

  it('links from a historical chart view to the expanded historical charts section', () => {
    const withHistorical: ModelEntry[] = [
      { id: 'anthropic:alpha', model: 'Alpha', score: 60, aa_version: 'v9.9', provider: 'Anthropic', open_weight: true, released: '2026-07-01' },
      { id: 'meta:epsilon', model: 'Epsilon', score: 57, aa_version: 'v4.1.1', provider: 'Meta', open_weight: false, released: '2026-08-05' },
      { id: 'openai:delta', model: 'Delta', score: 44, aa_version: 'v4.0.2', provider: 'OpenAI', open_weight: true, released: '2026-02-16' },
      { id: 'google:gamma', model: 'Gamma', score: 55, aa_version: 'v3.0', provider: 'Google', open_weight: false, released: '2025-12-17' },
    ]
    render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DashboardController allEntries={withHistorical} />
      </ThemeProvider>,
    )
    // No note while the newest version is shown; history starts collapsed.
    expect(screen.queryByRole('link', { name: 'Scores and costs predate the current index version' })).not.toBeInTheDocument()
    const historySummary = screen.getByRole('button', { name: 'Historical Artificial Analysis Intelligence charts' })
    expect(historySummary).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(screen.getAllByRole('button', { name: 'v3.0' })[0])
    const note = screen.getByRole('link', { name: 'Scores and costs predate the current index version' })
    expect(note).toHaveAttribute('href', '#historical-aa-title')
    fireEvent.click(note)
    expect(historySummary).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('img', { name: /Intelligence Index v3\.0 bar chart/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Intelligence Index v4\.0\.2 bar chart/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Intelligence Index v4\.1\.1 bar chart/i })).toBeInTheDocument()

    // The other captured versions show the note too.
    fireEvent.click(screen.getAllByRole('button', { name: 'v4.0.2' })[0])
    expect(screen.getByRole('link', { name: 'Scores and costs predate the current index version' })).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'v4.1.1' })[0])
    expect(screen.getByRole('link', { name: 'Scores and costs predate the current index version' })).toBeInTheDocument()

    // Returning to the newest version hides the note again.
    fireEvent.click(screen.getAllByRole('button', { name: 'v9.9' })[0])
    expect(screen.queryByRole('link', { name: 'Scores and costs predate the current index version' })).not.toBeInTheDocument()
  })

  it('hides the version toggle when the data carries a single index version', () => {
    renderDashboard()
    expect(screen.queryByRole('group', { name: 'Intelligence Index version' })).not.toBeInTheDocument()
  })

  it('shows the italic moving-target disclaimer under the title instead of the old sort description', () => {
    renderDashboard()
    const tagline = screen.getByText(/Best effort on a moving target/i)
    expect(tagline).toHaveStyle('font-style: italic')
    expect(tagline.textContent).toContain('your own use cases and evals may differ')
    expect(screen.queryByText(/Best effort in on a moving target/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/sorted highest to lowest by default/i)).not.toBeInTheDocument()
  })

  it('renders the intelligence benchmark section and no Senior SWE Bench section', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: 'Artificial Analysis Intelligence' })).toBeInTheDocument()
    // The Senior SWE Bench section (heading, solve-rate charts, source links)
    // was removed with swe.json.
    expect(screen.queryByRole('heading', { name: 'Senior SWE Bench' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Tasteful Solve Rate' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Basic Solve Rate' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Intelligence Score' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Senior SWE Bench/i })).not.toBeInTheDocument()
  })

  it('shows Hand Picked News collapsed by default with the top 3 links visible, expanding to reveal the rest', async () => {
    renderDashboard()
    const newsHeading = screen.getByRole('heading', { name: 'Hand Picked News' })
    const newsSection = newsHeading.closest('section')
    expect(newsSection).not.toBeNull()

    // Tomato icon present in the header
    const header = within(newsSection as HTMLElement).getByRole('button', { name: /Hand Picked News/i })
    expect(header.querySelector('svg')).toBeInTheDocument()

    // Collapsed by default: only the top 3 (newest) links are listed
    expect(header).toHaveAttribute('aria-expanded', 'false')
    let listItems = within(newsSection as HTMLElement).getAllByRole('listitem')
    expect(listItems).toHaveLength(3)
    expect(listItems[0].textContent).toContain('2026-07-26')
    expect(listItems[0].textContent).toContain('https://example.com/newest')
    expect(listItems[1].textContent).toContain('2026-07-24')
    expect(listItems[1].textContent).toContain('https://example.com/second')
    expect(listItems[2].textContent).toContain('2026-07-22')
    expect(listItems[2].textContent).toContain('https://example.com/third')

    // Links still carry the date as a title tooltip
    const links = within(newsSection as HTMLElement).getAllByRole('link')
    expect(links[0]).toHaveAttribute('title', '2026-07-26')
    expect(links[1]).toHaveAttribute('title', '2026-07-24')

    // Expanding reveals the remaining entries after the preview
    fireEvent.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'true')
    listItems = within(newsSection as HTMLElement).getAllByRole('listitem')
    expect(listItems).toHaveLength(5)
    expect(listItems[3].textContent).toContain('2026-07-20')
    expect(listItems[3].textContent).toContain('https://example.com/older')
    expect(listItems[4].textContent).toContain('2026-07-15')
    expect(listItems[4].textContent).toContain('https://example.com/oldest')

    // Collapsing returns to the top-3 preview (after the collapse transition)
    fireEvent.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => {
      expect(within(newsSection as HTMLElement).getAllByRole('listitem')).toHaveLength(3)
    })
  })

  it('shows Model Details right below the intelligence chart, ahead of news', () => {
    renderDashboard()
    const intelHeading = screen.getByRole('heading', { name: 'Artificial Analysis Intelligence' })
    const detailsSummary = screen.getByRole('button', { name: /Model Details/i })
    const newsHeading = screen.getByRole('heading', { name: 'Hand Picked News' })
    // Document order: chart section -> Model Details -> Hand Picked News.
    expect(intelHeading.compareDocumentPosition(detailsSummary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(detailsSummary.compareDocumentPosition(newsHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows the Pareto frontier between news and the historical charts, collapsed by default', () => {
    renderDashboard()
    const paretoHeading = screen.getByRole('heading', { name: 'Pareto frontier' })
    const paretoSection = paretoHeading.closest('section') as HTMLElement
    expect(paretoSection).not.toBeNull()

    // Sits between Hand Picked News and the historical charts in document order
    const newsHeading = screen.getByRole('heading', { name: 'Hand Picked News' })
    const historySummary = screen.getByRole('button', { name: 'Historical Artificial Analysis Intelligence charts' })
    expect(newsHeading.compareDocumentPosition(paretoHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(paretoHeading.compareDocumentPosition(historySummary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    // Collapsed by default: the chart and reference image stay out of the
    // accessibility tree until the summary is clicked.
    const header = within(paretoSection).getByRole('button', { name: 'Pareto frontier' })
    expect(header).toHaveAttribute('aria-expanded', 'false')
    expect(within(paretoSection).queryByRole('img', { name: /Intelligence Index versus cost/i })).not.toBeInTheDocument()

    fireEvent.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'true')
    // The captured chart image renders responsively with alt text and a source
    // credit. Keep the URL relative so the host's /benchmarks/ base applies.
    const image = within(paretoSection).getByRole('img', { name: /Intelligence Index versus cost/i })
    expect(image).toHaveAttribute('src', 'images/artificial-analysis-pareto-frontier.png')
    expect(within(paretoSection).getByRole('link', { name: 'Artificial Analysis' })).toHaveAttribute(
      'href',
      'https://artificialanalysis.ai/',
    )

    // Collapses again on click
    fireEvent.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')
  })

  it('sorts news by date desc by default and toggles to asc when the sort label is clicked', () => {
    renderDashboard()
    expandNews()
    const newsHeading = screen.getByRole('heading', { name: 'Hand Picked News' })
    const newsSection = newsHeading.closest('section') as HTMLElement
    const sortLabel = within(newsSection).getByRole('button', { name: /sort news by date/i })

    // Default: newest first (desc)
    let items = within(newsSection).getAllByRole('listitem')
    expect(items[0].textContent).toContain('2026-07-26')
    expect(items[items.length - 1].textContent).toContain('2026-07-15')

    // Click to toggle to ascending (oldest first)
    fireEvent.click(sortLabel)
    items = within(newsSection).getAllByRole('listitem')
    expect(items[0].textContent).toContain('2026-07-15')
    expect(items[items.length - 1].textContent).toContain('2026-07-26')

    // Click again to toggle back to descending
    fireEvent.click(sortLabel)
    items = within(newsSection).getAllByRole('listitem')
    expect(items[0].textContent).toContain('2026-07-26')
    expect(items[items.length - 1].textContent).toContain('2026-07-15')
  })

  it('starts with Model Details collapsed and expands it on click', () => {
    renderDashboard()
    const summary = screen.getByRole('button', { name: /Model Details/i })
    expect(summary).toHaveAttribute('aria-expanded', 'false')
    // The table stays out of the accessibility tree while collapsed
    expect(screen.queryByRole('table', { name: 'Model Details' })).not.toBeInTheDocument()
    fireEvent.click(summary)
    expect(summary).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('table', { name: 'Model Details' })).toBeInTheDocument()
  })

  it('renders the intelligence columns and no SWE metric columns in the table', () => {
    renderDashboard()
    expandModelDetails()
    const table = intelligenceTable()
    expect(within(table).getByRole('button', { name: /Intelligence/i })).toBeInTheDocument()
    expect(within(table).queryByRole('button', { name: /basic_solve_rate_pct/i })).not.toBeInTheDocument()
    expect(within(table).queryByRole('button', { name: /tasteful_solve_rate_pct/i })).not.toBeInTheDocument()
    expect(within(table).queryByRole('button', { name: /avg_steps/i })).not.toBeInTheDocument()
    expect(within(table).queryByRole('button', { name: /avg_tokens/i })).not.toBeInTheDocument()
  })

  it('orders the columns Intelligence, Model Name, Provider, Released, Benchmark cost USD', () => {
    renderDashboard()
    expandModelDetails()
    const table = intelligenceTable()
    const headers = within(table).getAllByRole('columnheader')
    expect(headers.map((header) => header.textContent)).toEqual([
      'Intelligence',
      'Model Name',
      'Provider',
      'Released',
      'Benchmark cost USD',
    ])

    // The release date renders in italics (<em>); "*" when unknown.
    const alphaRow = screen.getByRole('button', { name: 'Alpha' }).closest('tr') as HTMLElement
    const italic = alphaRow.querySelector('em')
    expect(italic).not.toBeNull()
    expect(italic).toHaveTextContent('2026-07-01')

    const betaRow = screen.getByRole('button', { name: 'Beta' }).closest('tr') as HTMLElement
    expect(betaRow.querySelector('em')).toHaveTextContent('*')
  })

  it('shows the benchmark cost in USD, "*" when unmeasured, with an italic footnote', () => {
    renderDashboard()
    expandModelDetails()
    const table = intelligenceTable()
    const alphaRow = screen.getByRole('button', { name: 'Alpha' }).closest('tr') as HTMLElement
    expect(alphaRow.textContent).toContain('$950')
    const gammaRow = screen.getByRole('button', { name: 'Gamma' }).closest('tr') as HTMLElement
    expect(gammaRow.textContent).toContain('$1,200')
    const betaRow = screen.getByRole('button', { name: 'Beta' }).closest('tr') as HTMLElement
    expect(betaRow.textContent).toContain('*')

    const footnote = within(table.closest('section') as HTMLElement).getByText(
      'USD Cost to Run Artificial Analysis Intelligence Index',
    )
    expect(footnote).toHaveStyle('font-style: italic')
  })

  it('sorts by benchmark cost when the cost header is clicked, missing costs last', () => {
    renderDashboard()
    expandModelDetails()
    const costHeader = within(intelligenceTable()).getByRole('button', { name: /Benchmark cost USD/i })
    fireEvent.click(costHeader) // asc: cheapest first, unmeasured last
    let rows = within(intelligenceTable()).getAllByRole('row')
    expect(rows[1].textContent).toContain('Alpha')
    expect(rows[2].textContent).toContain('Gamma')
    expect(rows[3].textContent).toContain('Beta')
    fireEvent.click(costHeader) // desc: priciest first, unmeasured still last
    rows = within(intelligenceTable()).getAllByRole('row')
    expect(rows[1].textContent).toContain('Gamma')
    expect(rows[2].textContent).toContain('Alpha')
    expect(rows[3].textContent).toContain('Beta')
  })

  it('hides the version selector in the Model Details summary when the data carries a single index version', () => {
    renderDashboard()
    expandModelDetails()
    const section = intelligenceTable().closest('section') as HTMLElement
    expect(within(section).queryByRole('group', { name: 'Intelligence Index version' })).not.toBeInTheDocument()
  })

  it('keeps the historical Artificial Analysis charts in a collapsed expander below Model Details', () => {
    renderDashboard()
    const summary = screen.getByRole('button', { name: 'Historical Artificial Analysis Intelligence charts' })
    const section = summary.closest('section') as HTMLElement
    expect(section).not.toBeNull()

    // Sits below Model Details in document order
    const detailsHeading = screen.getByRole('button', { name: /Model Details/i })
    expect(detailsHeading.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    // Collapsed by default; expanding reveals all three snapshots (v4.1.1
    // from 2026-08-11 first, then v4.0.2 from 2026-02-19, then v3.0 from
    // 2025-12-30), each with an index and a cost capture. URLs stay relative
    // so the host's /benchmarks/ base applies.
    expect(summary).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(summary)
    expect(summary).toHaveAttribute('aria-expanded', 'true')
    const v411Index = within(section).getByRole('img', { name: /Intelligence Index v4\.1\.1 bar chart/i })
    expect(v411Index).toHaveAttribute('src', 'images/2026-08-11-artificial-analysis-index.png')
    const v411Cost = within(section).getByRole('img', { name: /captured 2026-08-11.*cost to run the Intelligence Index/i })
    expect(v411Cost).toHaveAttribute('src', 'images/2026-08-11-artificial-analysis-index-eval-cost-usd.png')
    const v402Index = within(section).getByRole('img', { name: /Intelligence Index v4\.0\.2 bar chart/i })
    expect(v402Index).toHaveAttribute('src', 'images/2026-02-19-artificial-analysis-index.png')
    const v402Cost = within(section).getByRole('img', { name: /captured 2026-02-19.*cost to run the Intelligence Index/i })
    expect(v402Cost).toHaveAttribute('src', 'images/2026-02-19-artificial-analysis-index-eval-cost-usd.png')
    const v30Index = within(section).getByRole('img', { name: /Intelligence Index v3\.0 bar chart/i })
    expect(v30Index).toHaveAttribute('src', 'images/2025-12-30-artificial-analysis-index.png')
    const v30Cost = within(section).getByRole('img', { name: /captured 2025-12-30.*cost to run the Intelligence Index/i })
    expect(v30Cost).toHaveAttribute('src', 'images/2025-12-30-artificial-analysis-index-eval-cost-usd.png')
    // Newest snapshot first.
    expect(v411Index.compareDocumentPosition(v402Index) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(v402Index.compareDocumentPosition(v30Index) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(section).getAllByText(/captured 2026-08-11/).length).toBeGreaterThan(0)
    expect(within(section).getAllByText(/captured 2026-02-19/).length).toBeGreaterThan(0)
    expect(within(section).getAllByText(/captured 2025-12-30/).length).toBeGreaterThan(0)
    // Each block credits Artificial Analysis via its version's archived
    // methodology page, newest snapshot first.
    const credits = within(section).getAllByRole('link', { name: 'Artificial Analysis' })
    expect(credits).toHaveLength(3)
    expect(credits[0]).toHaveAttribute(
      'href',
      'https://web.archive.org/web/20260811173412/https://artificialanalysis.ai/methodology/intelligence-benchmarking',
    )
    expect(credits[1]).toHaveAttribute(
      'href',
      'https://web.archive.org/web/20260217215328/https://artificialanalysis.ai/methodology/intelligence-benchmarking',
    )
    expect(credits[2]).toHaveAttribute(
      'href',
      'https://web.archive.org/web/20251229181306/https://artificialanalysis.ai/methodology/intelligence-benchmarking',
    )
  })

  it('sorts by release date when the Released header is clicked', () => {
    renderDashboard()
    expandModelDetails()
    fireEvent.click(within(intelligenceTable()).getByRole('button', { name: /Released/i }))
    const rows = within(intelligenceTable()).getAllByRole('row')
    // Ascending: Gamma (2026-03-15) before Alpha (2026-07-01); unknown (Beta) last.
    expect(rows[1].textContent).toContain('Gamma')
    expect(rows[2].textContent).toContain('Alpha')
    expect(rows[3].textContent).toContain('Beta')
  })

  it('shows all rows in the table', () => {
    renderDashboard()
    expandModelDetails()
    expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Beta' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gamma' })).toBeInTheDocument()
  })

  it('defaults to score descending (highest first)', () => {
    renderDashboard()
    expandModelDetails()
    const rows = within(intelligenceTable()).getAllByRole('row')
    // Row 0 is the header; first data row should be the 60-score model.
    expect(rows[1].textContent).toContain('Alpha')
    expect(rows[rows.length - 1].textContent).toContain('Beta')
  })

  it('sorts by Provider ascending when the Provider header is clicked', () => {
    renderDashboard()
    expandModelDetails()
    fireEvent.click(within(intelligenceTable()).getByRole('button', { name: /Provider/i }))
    const rows = within(intelligenceTable()).getAllByRole('row')
    // Ascending provider order: Anthropic, Google, OpenAI.
    expect(rows[1].textContent).toContain('Anthropic')
    expect(rows[rows.length - 1].textContent).toContain('OpenAI')
  })

  it('toggles Provider to descending on a second click', () => {
    renderDashboard()
    expandModelDetails()
    const header = within(intelligenceTable()).getByRole('button', { name: /Provider/i })
    fireEvent.click(header) // asc
    fireEvent.click(header) // desc
    const rows = within(intelligenceTable()).getAllByRole('row')
    expect(rows[1].textContent).toContain('OpenAI')
    expect(rows[rows.length - 1].textContent).toContain('Anthropic')
  })

  it('toggles model selection from the model-name button', () => {
    renderDashboard()
    expandModelDetails()
    const alpha = screen.getByRole('button', { name: 'Alpha' })
    expect(alpha).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(alpha)
    expect(alpha).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows an empty chart state after every model is deselected', () => {
    renderDashboard()
    expandModelDetails()
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }))
    fireEvent.click(screen.getByRole('button', { name: 'Beta' }))
    fireEvent.click(screen.getByRole('button', { name: 'Gamma' }))
    expect(screen.getAllByText('No models selected')).toHaveLength(1)
  })

  it('renders the "Open Weights" toggle beside the Model Details title, off by default', () => {
    renderDashboard()
    expandModelDetails()
    const table = intelligenceTable()
    const section = table.closest('section') as HTMLElement
    const toggle = within(section).getByRole('button', { name: 'Open Weights' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  it('sets selection to open-weight models when "Open Weights" is toggled on', () => {
    renderDashboard()
    expandModelDetails()
    const table = intelligenceTable()
    const section = table.closest('section') as HTMLElement
    const toggle = within(section).getByRole('button', { name: 'Open Weights' })
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    // Only Alpha is open-weight -> stays selected; Beta and Gamma deselected.
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Gamma' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('re-selects every model when "Open Weights" is toggled back off', () => {
    renderDashboard()
    expandModelDetails()
    const table = intelligenceTable()
    const section = table.closest('section') as HTMLElement
    const toggle = within(section).getByRole('button', { name: 'Open Weights' })
    fireEvent.click(toggle) // on
    fireEvent.click(toggle) // off
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Gamma' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders the HuggingFace Estimated Hardware section with chart and table', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: 'HuggingFace Estimated Hardware' })).toBeInTheDocument()
    // Source chip links to HuggingFace
    expect(screen.getAllByRole('link', { name: /HuggingFace/i })[0]).toHaveAttribute(
      'href',
      'https://huggingface.co/unsloth',
    )
    // Hardware table is present with the current quant columns (UD-IQ1_S,
    // UD-IQ2_XXS and UD-IQ2_M were dropped in favor of UD-Q2_K_XL/UD-Q4_K_XL)
    const hwTable = screen.getByRole('table', { name: 'Unsloth Open Weight Hosting Sizes' })
    expect(within(hwTable).getByRole('button', { name: /Model/i })).toBeInTheDocument()
    expect(within(hwTable).getByRole('button', { name: /Intelligence/i })).toBeInTheDocument()
    expect(within(hwTable).getByRole('button', { name: /Total Params/i })).toBeInTheDocument()
    expect(within(hwTable).getByRole('button', { name: /UD-IQ1_M/i })).toBeInTheDocument()
    expect(within(hwTable).getByRole('button', { name: /UD-Q2_K_XL/i })).toBeInTheDocument()
    expect(within(hwTable).getByRole('button', { name: /UD-Q4_K_XL/i })).toBeInTheDocument()
    expect(within(hwTable).queryByRole('button', { name: /UD-IQ1_S/i })).not.toBeInTheDocument()
    expect(within(hwTable).queryByRole('button', { name: /UD-IQ2_XXS/i })).not.toBeInTheDocument()
    expect(within(hwTable).queryByRole('button', { name: /UD-IQ2_M/i })).not.toBeInTheDocument()
  })

  it('shows hardware quant sizes and placeholders for missing quants', () => {
    renderDashboard()
    const hwTable = screen.getByRole('table', { name: 'Unsloth Open Weight Hosting Sizes' })
    const rows = within(hwTable).getAllByRole('row')
    // At least one row has a numeric value and one has a placeholder
    const allText = rows.map((r) => r.textContent).join(' ')
    expect(allText).toContain('78.8')
    expect(allText).toContain('861')
    expect(allText).toContain('1510')
    expect(allText).toContain('11.8')
    expect(allText).toContain('*')
    // Intelligence column: joined score renders, null renders as '*'
    const inklingRow = rows.find((r) => r.textContent?.includes('Inkling'))
    expect(inklingRow?.textContent).toContain('42')
    const gemmaRow = rows.find((r) => r.textContent?.includes('Gemma 4 31B'))
    expect(gemmaRow?.textContent).toContain('*')
  })

  it('links model names to their HuggingFace URLs', () => {
    renderDashboard()
    const hwTable = screen.getByRole('table', { name: 'Unsloth Open Weight Hosting Sizes' })
    const inklingLink = within(hwTable).getByRole('link', { name: 'Inkling' })
    expect(inklingLink).toHaveAttribute('href', 'https://huggingface.co/unsloth/Inkling-Small-GGUF')
    const gemmaLink = within(hwTable).getByRole('link', { name: 'Gemma 4 31B' })
    expect(gemmaLink).toHaveAttribute('href', 'https://huggingface.co/unsloth/gemma-4-31B-it-GGUF')
  })

  it('sorts the hardware table by Intelligence descending by default', () => {
    renderDashboard()
    const hwTable = screen.getByRole('table', { name: 'Unsloth Open Weight Hosting Sizes' })
    const rows = within(hwTable).getAllByRole('row')
    // Default sort: intelligence desc -> Kimi K3 (60) first, Inkling (42) next,
    // and the unscored Gemma 4 31B last regardless of direction.
    expect(rows[1].textContent).toContain('Kimi K3')
    expect(rows[2].textContent).toContain('Inkling')
    expect(rows[rows.length - 1].textContent).toContain('Gemma 4 31B')
  })

  it('renders the Hardware section with GPU specifications table', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: 'Hardware' })).toBeInTheDocument()
    // Source chips link to NVIDIA pages
    expect(screen.getByRole('link', { name: /NVIDIA Hopper Architecture/i })).toHaveAttribute(
      'href',
      'https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/',
    )
    const gpuTable = screen.getByRole('table', { name: 'GPU Specifications' })
    expect(within(gpuTable).getByRole('button', { name: /GPU Model/i })).toBeInTheDocument()
    expect(within(gpuTable).getByRole('button', { name: /Date/i })).toBeInTheDocument()
    expect(within(gpuTable).getByRole('button', { name: /Memory Type/i })).toBeInTheDocument()
    expect(within(gpuTable).getByRole('button', { name: /Mem BW/i })).toBeInTheDocument()
    expect(within(gpuTable).getByRole('button', { name: /FP16/i })).toBeInTheDocument()
  })

  it('shows GPU specs and placeholders for missing values', () => {
    renderDashboard()
    const gpuTable = screen.getByRole('table', { name: 'GPU Specifications' })
    const rows = within(gpuTable).getAllByRole('row')
    const allText = rows.map((r) => r.textContent).join(' ')
    expect(allText).toContain('3355')
    expect(allText).toContain('1979')
    expect(allText).toContain('1466')
  })

  it('sorts the GPU table by date descending by default', () => {
    renderDashboard()
    const gpuTable = screen.getByRole('table', { name: 'GPU Specifications' })
    const rows = within(gpuTable).getAllByRole('row')
    // Default sort: date desc -> L40 (2022-11) first, A100 (2020) last
    expect(rows[1].textContent).toContain('L40 (Ada)')
    expect(rows[rows.length - 1].textContent).toContain('A100 (SXM)')
  })

  it('renders the Local Hardware section after the GPU section with source links', () => {
    renderDashboard()
    const localHeading = screen.getByRole('heading', { name: 'Local Hardware' })
    const gpuHeading = screen.getByRole('heading', { name: 'Hardware' })
    expect(
      gpuHeading.compareDocumentPosition(localHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    const localSection = localHeading.closest('section') as HTMLElement
    expect(localSection).not.toBeNull()
    expect(
      within(localSection).getByRole('link', { name: /Daring Fireball/i }),
    ).toHaveAttribute(
      'href',
      'https://daringfireball.net/2026/08/configurations_and_pricing_for_new_mac_minis_and_mac_studios',
    )
    const table = within(localSection).getByRole('table', { name: 'Local AI Machines' })
    expect(within(table).getByRole('button', { name: /^Machine$/i })).toBeInTheDocument()
    expect(within(table).getByRole('button', { name: /Chip/i })).toBeInTheDocument()
    expect(within(table).getByRole('button', { name: /Unified Memory/i })).toBeInTheDocument()
    expect(within(table).getByRole('button', { name: /Mem BW/i })).toBeInTheDocument()
    expect(within(table).getByRole('button', { name: /Price/i })).toBeInTheDocument()
  })

  it('sorts the local hardware table by VRAM descending by default', () => {
    renderDashboard()
    const table = screen.getByRole('table', { name: 'Local AI Machines' })
    const rows = within(table).getAllByRole('row')
    // Default sort: vram_gb desc -> Mac Studio (256 GB) first, Mac mini (32 GB) last
    expect(rows[1].textContent).toContain('Mac Studio (M5 Ultra, 2026)')
    expect(rows[rows.length - 1].textContent).toContain('Mac mini (M6, 2026)')
  })

  it('shows local hardware prices formatted and links machine names to their sources', () => {
    renderDashboard()
    const table = screen.getByRole('table', { name: 'Local AI Machines' })
    const rows = within(table).getAllByRole('row')
    const studioRow = rows.find((r) => r.textContent?.includes('Mac Studio'))
    expect(studioRow?.textContent).toContain('$9,499')
    expect(studioRow?.textContent).toContain('1200')
    expect(within(table).getByRole('link', { name: 'NVIDIA DGX Spark' })).toHaveAttribute(
      'href',
      'https://example.com/dgx-spark',
    )
  })
})
