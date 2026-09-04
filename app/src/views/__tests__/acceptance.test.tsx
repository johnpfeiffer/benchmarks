import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import App from '../../App'
import {
  parseModelEntries,
  parseSweEntries,
  parseNewsEntries,
  parseHardwareEntries,
  parseGpuEntries,
  parseMachineEntries,
  mergeSweMetrics,
  mergeHardwareIntelligence,
  modelMatchKey,
} from '../../models'
import rawIntelligenceData from '../../data/ai.json'
import rawSweData from '../../data/swe.json'
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
const intelligence = parseModelEntries(rawIntelligenceData)
const swe = parseSweEntries(rawSweData)
const news = parseNewsEntries(rawNewsData)
const hardware = mergeHardwareIntelligence(parseHardwareEntries(rawHardwareData), intelligence)
const gpu = parseGpuEntries(rawGpuData)
const machines = parseMachineEntries(rawMachineData)
const tableEntries = mergeSweMetrics(intelligence, swe)

function modelRow(table: HTMLElement, model: string): HTMLElement {
  const toggle = within(table).getByRole('button', { name: model })
  const row = toggle.closest('tr')
  if (!row) throw new Error(`no table row for ${model}`)
  return row
}

describe('acceptance: every JSON row appears in the UI', () => {
  it('lists every ai.json model in the Model Details table with provider, italic release date, and score', () => {
    render(<App />)
    const table = screen.getByRole('table', { name: 'Model Details' })
    expect(within(table).getAllByRole('row')).toHaveLength(tableEntries.length + 1)
    for (const entry of tableEntries) {
      const row = modelRow(table, entry.model)
      expect(row.textContent).toContain(entry.provider)
      expect(row.textContent).toContain(String(entry.score))
      // The release date renders in italics (<em>); "*" when unknown.
      const italic = row.querySelector('em')
      expect(italic).not.toBeNull()
      expect(italic?.textContent).toBe(entry.released ?? '*')
    }
  })

  it('merges every swe.json row\'s metrics into its model\'s table row', () => {
    render(<App />)
    const table = screen.getByRole('table', { name: 'Model Details' })
    const aiByKey = new Map(intelligence.map((entry) => [modelMatchKey(entry.model), entry]))
    for (const s of swe) {
      const ai = aiByKey.get(modelMatchKey(s.model))
      if (!ai) throw new Error(`swe model ${s.model} has no ai.json row`)
      const row = modelRow(table, ai.model)
      expect(row.textContent).toContain(String(s.tasteful_solve_rate_pct))
      expect(row.textContent).toContain(String(s.basic_solve_rate_pct))
      expect(row.textContent).toContain(String(s.avg_steps))
      expect(row.textContent).toContain(s.avg_tokens)
    }
  })

  it('lists every news.json entry in Hand Picked News as a dated link', () => {
    render(<App />)
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
    const table = screen.getByRole('table', { name: 'Open Weight Hosting Sizes' })
    expect(within(table).getAllByRole('row')).toHaveLength(hardware.length + 1)
    for (const h of hardware) {
      const link = within(table).getByRole('link', { name: h.model })
      expect(link).toHaveAttribute('href', h.url)
      const row = link.closest('tr') as HTMLElement
      expect(row.textContent).toContain(h.provider)
      expect(row.textContent).toContain(h.total_params)
      for (const quant of [h.iq1_s_gb, h.iq1_m_gb, h.iq2_xxs_gb, h.iq2_m_gb]) {
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
})
