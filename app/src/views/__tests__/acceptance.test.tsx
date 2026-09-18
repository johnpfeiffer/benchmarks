import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import App from '../../App'
import {
  parseModelEntries,
  parseNewsEntries,
  parseHardwareEntries,
  parseGpuEntries,
  parseMachineEntries,
  mergeHardwareIntelligence,
  aaVersionsDesc,
  filterByAAVersion,
} from '../../models'
import rawIntelligenceData from '../../data/ai.json'
import rawHistoricalV411Data from '../../data/ai-2026-08-11.json'
import rawHistoricalV402Data from '../../data/ai-2026-02-19.json'
import rawHistoricalV30Data from '../../data/ai-2025-12-30.json'
import rawNewsData from '../../data/news.json'
import rawHardwareData from '../../data/hardware.json'
import rawGpuData from '../../data/gpu.json'
import rawMachineData from '../../data/machines.json'

/**
 * Acceptance suite: renders the real app with the real embedded JSON and
 * checks that every data row appears in the corresponding UI listing. This
 * replaces the old per-row value assertions in data.test.ts — the question
 * that matters is not "does the parser return what the file says" (a
 * tautology) but "does the user actually see every row of the data".
 */
// Mirror App.tsx: ai.json plus the historical v4.1.1, v4.0.2, and v3.0 backfill snapshots.
const intelligence = parseModelEntries([
  ...rawIntelligenceData,
  ...rawHistoricalV411Data,
  ...rawHistoricalV402Data,
  ...rawHistoricalV30Data,
])
const news = parseNewsEntries(rawNewsData)
// Mirror App.tsx: the dashboard shows one index version at a time (newest by
// default), and hardware scores always merge from the newest version's block.
const latestVersion = aaVersionsDesc(intelligence)[0]
const latestIntelligence = filterByAAVersion(intelligence, latestVersion)
const hardware = mergeHardwareIntelligence(parseHardwareEntries(rawHardwareData), latestIntelligence)
const gpu = parseGpuEntries(rawGpuData)
const machines = parseMachineEntries(rawMachineData)

function modelRow(table: HTMLElement, model: string): HTMLElement {
  const toggle = within(table).getByRole('button', { name: model })
  const row = toggle.closest('tr')
  if (!row) throw new Error(`no table row for ${model}`)
  return row
}

/** Expand a collapsed-by-default accordion section via its summary button. */
function expandSection(summaryName: RegExp) {
  fireEvent.click(screen.getByRole('button', { name: summaryName }))
}

describe('acceptance: every JSON row appears in the UI', () => {
  it('lists every ai.json model of the newest index version in the Model Details table with provider, italic release date, and score', () => {
    render(<App />)
    // Model Details starts collapsed; open it to reveal the table.
    expandSection(/Model Details/)
    const table = screen.getByRole('table', { name: 'Model Details' })
    expect(within(table).getAllByRole('row')).toHaveLength(latestIntelligence.length + 1)
    const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
    for (const entry of latestIntelligence) {
      const row = modelRow(table, entry.model)
      expect(row.textContent).toContain(entry.provider)
      expect(row.textContent).toContain(String(entry.score))
      // The release date renders in italics (<em>); "*" when unknown.
      const italic = row.querySelector('em')
      expect(italic).not.toBeNull()
      expect(italic?.textContent).toBe(entry.released ?? '*')
      // Costed rows show the total benchmark run cost as USD.
      if (entry.cost_usd !== undefined) {
        expect(row.textContent).toContain(usd.format(entry.cost_usd))
      }
    }
  })

  it('switches the Model Details table between index-version snapshots via the version toggle', () => {
    render(<App />)
    expandSection(/Model Details/)
    const table = screen.getByRole('table', { name: 'Model Details' })
    const versions = aaVersionsDesc(intelligence)
    const previousVersion = versions[1]
    const previousRows = filterByAAVersion(intelligence, previousVersion)
    // The version selector lives in the Model Details summary and drives the
    // chart and table.
    const versionButton = (version: string) => screen.getAllByRole('button', { name: version })[0]
    // Claude Sonnet 4.6 (max) was never re-measured under the newest index
    // version, so it only exists in the older snapshot.
    expect(within(table).queryByRole('button', { name: 'Claude Sonnet 4.6 (max)' })).not.toBeInTheDocument()
    fireEvent.click(versionButton(previousVersion))
    expect(within(table).getAllByRole('row')).toHaveLength(previousRows.length + 1)
    // Models that first appear under the newly shown version start selected:
    // their rows are not grayed out and they join the chart.
    expect(within(table).getByRole('button', { name: 'Claude Sonnet 4.6 (max)' })).toHaveAttribute('aria-pressed', 'true')
    // The v4.1.1 backfill snapshot is listed and selectable like any version.
    const v411Rows = filterByAAVersion(intelligence, 'v4.1.1')
    fireEvent.click(versionButton('v4.1.1'))
    expect(within(table).getAllByRole('row')).toHaveLength(v411Rows.length + 1)
    expect(within(table).getByRole('button', { name: 'Kimi K3 (max)' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(table).getByRole('button', { name: 'Claude Fable 5 (max)' }).closest('tr')?.textContent).toContain('$5,455')
    // The v4.0.2 backfill snapshot is listed and selectable like any version.
    const v402Rows = filterByAAVersion(intelligence, 'v4.0.2')
    fireEvent.click(versionButton('v4.0.2'))
    expect(within(table).getAllByRole('row')).toHaveLength(v402Rows.length + 1)
    expect(within(table).getByRole('button', { name: 'GLM-5' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(table).getByRole('button', { name: 'Claude Opus 4.6 (max)' }).closest('tr')?.textContent).toContain('$2,486')
    expect(within(table).queryByRole('button', { name: 'Kimi K2 Thinking' })).toHaveAttribute('aria-pressed', 'true')
    // The v3.0 backfill snapshot is listed and selectable like any version.
    const historicalRows = filterByAAVersion(intelligence, 'v3.0')
    fireEvent.click(versionButton('v3.0'))
    expect(within(table).getAllByRole('row')).toHaveLength(historicalRows.length + 1)
    expect(within(table).getByRole('button', { name: 'Kimi K2 Thinking' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(table).queryByRole('button', { name: 'Claude Sonnet 4.6 (max)' })).not.toBeInTheDocument()
    fireEvent.click(versionButton(latestVersion))
    expect(within(table).getAllByRole('row')).toHaveLength(latestIntelligence.length + 1)
    expect(within(table).queryByRole('button', { name: 'Claude Sonnet 4.6 (max)' })).not.toBeInTheDocument()
    expect(versions).toEqual(['v4.3', 'v4.2', 'v4.1.1', 'v4.0.2', 'v3.0'])
  })

  it('selects every model of the shown version after mixing the Open Weights preset with version switches', () => {
    // Regression: selection used to persist across version switches, so a
    // preset from another version could shrink the chart to a handful of
    // models (e.g. only Claude 4.5 Haiku) with no visible explanation.
    render(<App />)
    expandSection(/Model Details/)
    const table = screen.getByRole('table', { name: 'Model Details' })
    const section = table.closest('section') as HTMLElement
    const openWeights = () => within(section).getByRole('button', { name: 'Open Weights' })
    const versionButton = (version: string) => screen.getAllByRole('button', { name: version })[0]

    fireEvent.click(openWeights()) // preset on: only open-weight v4.3 models
    fireEvent.click(versionButton('v3.0'))
    fireEvent.click(openWeights()) // preset on for v3.0
    fireEvent.click(versionButton('v4.2'))

    const previousRows = filterByAAVersion(intelligence, 'v4.2')
    expect(within(table).getAllByRole('row')).toHaveLength(previousRows.length + 1)
    for (const entry of previousRows) {
      expect(within(table).getByRole('button', { name: entry.model })).toHaveAttribute('aria-pressed', 'true')
    }
    // The preset flag reflects the selection: a full version is showing.
    expect(openWeights()).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByText('No models selected')).not.toBeInTheDocument()
  })

  it('shows the predate note on versions with historical chart captures and expands the section when clicked', () => {
    render(<App />)
    // Newest version: no note, historical section collapsed.
    expect(screen.queryByRole('link', { name: 'Scores and costs predate the current index version' })).not.toBeInTheDocument()
    const historySummary = screen.getByRole('button', { name: 'Historical Artificial Analysis Intelligence charts' })
    expect(historySummary).toHaveAttribute('aria-expanded', 'false')

    // v4.1.1 is a historical snapshot: the note links to and opens the
    // historical section, which holds all three snapshots' captures.
    fireEvent.click(screen.getAllByRole('button', { name: 'v4.1.1' })[0])
    const note = screen.getByRole('link', { name: 'Scores and costs predate the current index version' })
    expect(note).toHaveAttribute('href', '#historical-aa-title')
    fireEvent.click(note)
    expect(historySummary).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('img', { name: /Intelligence Index v4\.1\.1 bar chart/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Intelligence Index v4\.0\.2 bar chart/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Intelligence Index v3\.0 bar chart/i })).toBeInTheDocument()

    // v3.0 is the other historical snapshot: the note shows there too.
    fireEvent.click(screen.getAllByRole('button', { name: 'v3.0' })[0])
    expect(screen.getByRole('link', { name: 'Scores and costs predate the current index version' })).toBeInTheDocument()

    // v4.2 has no captured charts: no note.
    fireEvent.click(screen.getAllByRole('button', { name: 'v4.2' })[0])
    expect(screen.queryByRole('link', { name: 'Scores and costs predate the current index version' })).not.toBeInTheDocument()
  })

  it('lists every news.json entry in Hand Picked News as a dated link', () => {
    render(<App />)
    // Hand Picked News starts collapsed with a top-3 preview; open it so the
    // remaining entries join the list.
    expandSection(/Hand Picked News/)
    const section = screen.getByRole('heading', { name: 'Hand Picked News' }).closest('section') as HTMLElement
    expect(within(section).getAllByRole('listitem')).toHaveLength(news.length)
    for (const entry of news) {
      const link = within(section).getByRole('link', { name: entry.url })
      expect(link).toHaveAttribute('href', entry.url)
      expect(link.closest('li')?.textContent).toContain(entry.date)
    }
  })

  it('lists every hardware.json row in the hosting-sizes table with its source link', () => {
    render(<App />)
    const table = screen.getByRole('table', { name: 'Unsloth Open Weight Hosting Sizes' })
    expect(within(table).getAllByRole('row')).toHaveLength(hardware.length + 1)
    for (const h of hardware) {
      const link = within(table).getByRole('link', { name: h.model })
      expect(link).toHaveAttribute('href', h.url)
      const row = link.closest('tr') as HTMLElement
      expect(row.textContent).toContain(h.provider)
      expect(row.textContent).toContain(h.total_params)
      for (const quant of [h.iq1_m_gb, h.q2_k_xl_gb, h.q4_k_xl_gb]) {
        if (quant !== null) expect(row.textContent).toContain(String(quant))
      }
      expect(row.textContent).toContain(
        h.intelligence_score == null ? '*' : String(h.intelligence_score),
      )
    }
  })

  it('lists every gpu.json row in the GPU table', () => {
    render(<App />)
    const table = screen.getByRole('table', { name: 'GPU Specifications' })
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(gpu.length + 1)
    for (const g of gpu) {
      const row = rows.find((r) => r.textContent?.includes(g.model))
      expect(row, `row for ${g.model}`).toBeDefined()
      expect(row?.textContent).toContain(g.date)
      if (g.memory) expect(row?.textContent).toContain(g.memory)
      if (g.memory_type) expect(row?.textContent).toContain(g.memory_type)
      if (g.memory_bandwidth_gbs !== null) expect(row?.textContent).toContain(String(g.memory_bandwidth_gbs))
      if (g.fp16_tflops !== null) expect(row?.textContent).toContain(String(g.fp16_tflops))
    }
  })

  it('lists every machines.json row in the Local Hardware table with price and link', () => {
    render(<App />)
    const table = screen.getByRole('table', { name: 'Local AI Machines' })
    expect(within(table).getAllByRole('row')).toHaveLength(machines.length + 1)
    for (const m of machines) {
      const link = within(table).getByRole('link', { name: m.machine })
      expect(link).toHaveAttribute('href', m.url)
      const row = link.closest('tr') as HTMLElement
      expect(row.textContent).toContain(m.chip)
      expect(row.textContent).toContain(String(m.vram_gb))
      if (m.price_usd !== null) {
        expect(row.textContent).toContain(`$${m.price_usd.toLocaleString('en-US')}`)
      }
    }
  })

  it('credits the Artificial Analysis Intelligence Index with its version number in the footer', () => {
    render(<App />)
    const footer = screen.getByRole('contentinfo')
    const credit = within(footer).getByRole('link', { name: 'Artificial Analysis Intelligence Index v4.3' })
    expect(credit).toHaveAttribute('href', 'https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v4-3')
  })
})
