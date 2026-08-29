import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { useState } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { theme } from '../../theme'
import { Dashboard } from '../Dashboard'
import { sortModels, nextSortState, openWeightIds, DEFAULT_SORT, type ModelEntry, type HardwareEntry, type GpuEntry, type SortField, type SortState } from '../../models'

const entries: ModelEntry[] = [
  {
    id: 'anthropic:alpha',
    model: 'Alpha',
    score: 60,
    provider: 'Anthropic',
    open_weight: true,
    tasteful_solve_rate_pct: 29.1,
    basic_solve_rate_pct: 46.5,
    avg_steps: 159,
    avg_tokens: '290.2K',
  },
  { id: 'openai:beta', model: 'Beta', score: 50, provider: 'OpenAI', open_weight: false },
  { id: 'google:gamma', model: 'Gamma', score: 55, provider: 'Google', open_weight: false },
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

const hardwareEntries: HardwareEntry[] = [
  { model: 'Inkling', provider: 'Thinking Machines', total_params: '264B', iq1_s_gb: 74.8, iq1_m_gb: 78.8, iq2_xxs_gb: 82.3, iq2_m_gb: 82.4, url: 'https://huggingface.co/unsloth/Inkling-Small-GGUF', intelligence_score: 42 },
  { model: 'Kimi K3', provider: 'Moonshot AI', total_params: '2.8T', iq1_s_gb: 594, iq1_m_gb: 649, iq2_xxs_gb: 711, iq2_m_gb: null, url: 'https://huggingface.co/unsloth/Kimi-K3-GGUF', intelligence_score: 60 },
  { model: 'Gemma 4 31B', provider: 'Google', total_params: '31B', iq1_s_gb: null, iq1_m_gb: null, iq2_xxs_gb: 8.53, iq2_m_gb: 10.8, url: 'https://huggingface.co/unsloth/gemma-4-31B-it-GGUF', intelligence_score: null },
]

const gpuEntries: GpuEntry[] = [
  { model: 'A100 (SXM)', date: '2020', memory: '40 HBM2e (80* opt)', memory_type: 'HBM2e', memory_bandwidth_gbs: 1555, fp16_tflops: 312 },
  { model: 'H100 (SXM)', date: '2022-10', memory: '80 GB HBM3e', memory_type: 'HBM3e', memory_bandwidth_gbs: 3355, fp16_tflops: 1979 },
  { model: 'L40 (Ada)', date: '2022-11', memory: '48 GB GDDR6', memory_type: 'GDDR6', memory_bandwidth_gbs: 864, fp16_tflops: 1466 },
]

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
      intelligenceSource={{ label: 'Artificial Analysis', href: 'https://artificialanalysis.ai/' }}
      news={[
        { url: 'https://example.com/newest', date: '2026-07-26' },
        { url: 'https://example.com/older', date: '2026-07-20' },
      ]}
      hardware={hardwareEntries}
      hardwareSource={{ label: 'HuggingFace', href: 'https://huggingface.co/unsloth' }}
      sweSource={{ label: 'Senior SWE Bench', href: 'https://senior-swe-bench.snorkel.ai/' }}
      gpu={gpuEntries}
      gpuSources={[
        { label: 'NVIDIA Hopper Architecture', href: 'https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/' },
        { label: 'NVIDIA RTX Pro 6000', href: 'https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000/' },
        { label: 'NVIDIA H200', href: 'https://www.nvidia.com/en-us/data-center/h200/' },
      ]}
      sources={[
        { label: 'Artificial Analysis', href: 'https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v4-1-1' },
        { label: 'Senior SWE Bench', href: 'https://senior-swe-bench.snorkel.ai/' },
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

describe('Dashboard', () => {
  it('renders the heading and the data-source credit', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: /AI Model Benchmarks/i })).toBeInTheDocument()
    const artificialAnalysisLinks = screen.getAllByRole('link', { name: /Artificial Analysis/i })
    // The chart chip links to the AA homepage; the footer credit links to the
    // Intelligence Index v4.1.1 article.
    expect(artificialAnalysisLinks[0]).toHaveAttribute('href', 'https://artificialanalysis.ai/')
    expect(artificialAnalysisLinks[artificialAnalysisLinks.length - 1]).toHaveAttribute(
      'href',
      'https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v4-1-1',
    )
    expect(screen.getAllByRole('link', { name: /Senior SWE Bench/i })[0]).toHaveAttribute(
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

  it('shows a Source chip on the SWE Bench charts linking to Senior SWE Bench', () => {
    renderDashboard()
    const sweLinks = screen.getAllByRole('link', { name: /Source: Senior SWE Bench/i })
    expect(sweLinks).toHaveLength(2)
    sweLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', 'https://senior-swe-bench.snorkel.ai/')
    })
  })

  it('shows Hand Picked News below the lead chart, expanded by default, with visible dates and collapse control', () => {
    renderDashboard()
    const newsHeading = screen.getByRole('heading', { name: 'Hand Picked News' })
    const newsSection = newsHeading.closest('section')
    expect(newsSection).not.toBeNull()

    // Tomato icon present in the header
    const header = within(newsSection as HTMLElement).getByRole('button', { name: /Hand Picked News/i })
    expect(header.querySelector('svg')).toBeInTheDocument()

    // Each row shows the date as visible text alongside the URL link
    const listItems = within(newsSection as HTMLElement).getAllByRole('listitem')
    expect(listItems).toHaveLength(2)
    expect(listItems[0].textContent).toContain('2026-07-26')
    expect(listItems[0].textContent).toContain('https://example.com/newest')
    expect(listItems[1].textContent).toContain('2026-07-20')
    expect(listItems[1].textContent).toContain('https://example.com/older')

    // Links still carry the date as a title tooltip
    const links = within(newsSection as HTMLElement).getAllByRole('link')
    expect(links[0]).toHaveAttribute('title', '2026-07-26')
    expect(links[1]).toHaveAttribute('title', '2026-07-20')

    // Accordion starts expanded and collapses on click
    expect(header).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows the Pareto frontier image between news and model details, expanded by default', () => {
    renderDashboard()
    const paretoHeading = screen.getByRole('heading', { name: 'Pareto frontier' })
    const paretoSection = paretoHeading.closest('section') as HTMLElement
    expect(paretoSection).not.toBeNull()

    // Sits between Hand Picked News and Model Details in document order
    const newsHeading = screen.getByRole('heading', { name: 'Hand Picked News' })
    const detailsTable = screen.getByRole('table', { name: 'Model Details' })
    expect(newsHeading.compareDocumentPosition(paretoHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(paretoHeading.compareDocumentPosition(detailsTable) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    // The captured chart image renders responsively with alt text and a source
    // credit. It is a bundled (fingerprinted) asset, so just check the name.
    const image = within(paretoSection).getByRole('img', { name: /Intelligence Index versus cost/i })
    expect(image.getAttribute('src')).toContain('artificial-analysis-pareto-frontier')
    expect(within(paretoSection).getByRole('link', { name: 'Artificial Analysis' })).toHaveAttribute(
      'href',
      'https://artificialanalysis.ai/',
    )

    // Accordion starts expanded and collapses on click
    const header = within(paretoSection).getByRole('button', { name: /Pareto frontier/i })
    expect(header).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')
  })

  it('sorts news by date desc by default and toggles to asc when the sort label is clicked', () => {
    renderDashboard()
    const newsHeading = screen.getByRole('heading', { name: 'Hand Picked News' })
    const newsSection = newsHeading.closest('section') as HTMLElement
    const sortLabel = within(newsSection).getByRole('button', { name: /sort news by date/i })

    // Default: newest first (desc)
    let items = within(newsSection).getAllByRole('listitem')
    expect(items[0].textContent).toContain('2026-07-26')
    expect(items[1].textContent).toContain('2026-07-20')

    // Click to toggle to ascending (oldest first)
    fireEvent.click(sortLabel)
    items = within(newsSection).getAllByRole('listitem')
    expect(items[0].textContent).toContain('2026-07-20')
    expect(items[1].textContent).toContain('2026-07-26')

    // Click again to toggle back to descending
    fireEvent.click(sortLabel)
    items = within(newsSection).getAllByRole('listitem')
    expect(items[0].textContent).toContain('2026-07-26')
    expect(items[1].textContent).toContain('2026-07-20')
  })

  it('renders the SWE metric columns in the existing table', () => {
    renderDashboard()
    const table = intelligenceTable()
    expect(within(table).getByRole('button', { name: /Intelligence/i })).toBeInTheDocument()
    expect(within(table).getByRole('button', { name: /basic_solve_rate_pct/i })).toBeInTheDocument()
    expect(within(table).getByRole('button', { name: /tasteful_solve_rate_pct/i })).toBeInTheDocument()
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

  it('renders the "Open Weights" toggle beside the Model Details title, off by default', () => {
    renderDashboard()
    const table = intelligenceTable()
    const section = table.closest('section') as HTMLElement
    const toggle = within(section).getByRole('button', { name: 'Open Weights' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  it('sets selection to open-weight models when "Open Weights" is toggled on', () => {
    renderDashboard()
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

  it('renders an "Open Weights" toggle beside the Senior SWE Bench title', () => {
    renderDashboard()
    const sweHeading = screen.getByRole('heading', { name: 'Senior SWE Bench' })
    const sweSection = sweHeading.closest('section') as HTMLElement
    const toggle = within(sweSection).getByRole('button', { name: 'Open Weights' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders the HuggingFace Estimated Hardware section with chart and table', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: 'HuggingFace Estimated Hardware' })).toBeInTheDocument()
    // Source chip links to HuggingFace
    expect(screen.getAllByRole('link', { name: /HuggingFace/i })[0]).toHaveAttribute(
      'href',
      'https://huggingface.co/unsloth',
    )
    // Hardware table is present with expected columns
    const hwTable = screen.getByRole('table', { name: 'Open Weight Hosting Sizes' })
    expect(within(hwTable).getByRole('button', { name: /Model/i })).toBeInTheDocument()
    expect(within(hwTable).getByRole('button', { name: /Intelligence/i })).toBeInTheDocument()
    expect(within(hwTable).getByRole('button', { name: /Total Params/i })).toBeInTheDocument()
    expect(within(hwTable).getByRole('button', { name: /UD-IQ1_S/i })).toBeInTheDocument()
    expect(within(hwTable).getByRole('button', { name: /UD-IQ1_M/i })).toBeInTheDocument()
    expect(within(hwTable).getByRole('button', { name: /UD-IQ2_XXS/i })).toBeInTheDocument()
    expect(within(hwTable).getByRole('button', { name: /UD-IQ2_M/i })).toBeInTheDocument()
  })

  it('shows hardware quant sizes and placeholders for missing 1-bit and 2-bit quants', () => {
    renderDashboard()
    const hwTable = screen.getByRole('table', { name: 'Open Weight Hosting Sizes' })
    const rows = within(hwTable).getAllByRole('row')
    // At least one row has a numeric value and one has a placeholder
    const allText = rows.map((r) => r.textContent).join(' ')
    expect(allText).toContain('74.8')
    expect(allText).toContain('594')
    expect(allText).toContain('82.3')
    expect(allText).toContain('8.53')
    expect(allText).toContain('*')
    // Intelligence column: joined score renders, null renders as '*'
    const inklingRow = rows.find((r) => r.textContent?.includes('Inkling'))
    expect(inklingRow?.textContent).toContain('42')
    const gemmaRow = rows.find((r) => r.textContent?.includes('Gemma 4 31B'))
    expect(gemmaRow?.textContent).toContain('*')
  })

  it('links model names to their HuggingFace URLs', () => {
    renderDashboard()
    const hwTable = screen.getByRole('table', { name: 'Open Weight Hosting Sizes' })
    const inklingLink = within(hwTable).getByRole('link', { name: 'Inkling' })
    expect(inklingLink).toHaveAttribute('href', 'https://huggingface.co/unsloth/Inkling-Small-GGUF')
    const gemmaLink = within(hwTable).getByRole('link', { name: 'Gemma 4 31B' })
    expect(gemmaLink).toHaveAttribute('href', 'https://huggingface.co/unsloth/gemma-4-31B-it-GGUF')
  })

  it('sorts the hardware table by Total Params descending by default', () => {
    renderDashboard()
    const hwTable = screen.getByRole('table', { name: 'Open Weight Hosting Sizes' })
    const rows = within(hwTable).getAllByRole('row')
    // Default sort: total_params desc -> Kimi K3 (2.8T) first, Gemma 4 31B (31B) last
    expect(rows[1].textContent).toContain('Kimi K3')
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
})
