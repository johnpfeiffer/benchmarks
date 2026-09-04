import { describe, it, expect } from 'vitest'
import { parseModelEntries, parseNewsEntries, parseSweEntries, parseHardwareEntries, parseMachineEntries } from '../parse'
import { mergeHardwareIntelligence, modelMatchKey } from '../merge'
import rawIntelligenceData from '../../data/ai.json'
import rawSweData from '../../data/swe.json'
import rawNewsData from '../../data/news.json'
import rawHardwareData from '../../data/hardware.json'
import rawMachineData from '../../data/machines.json'

/**
 * Data-integrity invariants only. This suite used to assert each JSON row's
 * values verbatim — a tautology, since it could only pass by restating the
 * file it had just parsed. Per-row coverage now lives in the acceptance suite
 * (views/__tests__/acceptance.test.tsx), which renders the real data through
 * the UI and checks the listings match. What remains here are the properties
 * neither the parser nor the UI can see: cross-file relationships, ordering
 * and uniqueness conventions, and value-shape invariants.
 */
describe('embedded data integrity', () => {
  const intelligence = parseModelEntries(rawIntelligenceData)
  const swe = parseSweEntries(rawSweData)
  const news = parseNewsEntries(rawNewsData)
  const hardware = parseHardwareEntries(rawHardwareData)
  const machines = parseMachineEntries(rawMachineData)
  const intelligenceKeys = new Set(intelligence.map((entry) => modelMatchKey(entry.model)))

  it('every Senior SWE Bench model has a matching Artificial Analysis row', () => {
    // Regression: SWE-only models (Claude Opus 4.7, GPT-5.4, Claude Sonnet 4.6)
    // previously had no AI counterpart, so the "Open Weights Only" preset
    // (which deselects non-open-weight AI models) never removed them from the
    // SWE charts. Every SWE model must now match an AI row so the selection
    // propagates fully.
    const orphans = swe
      .map((entry) => modelMatchKey(entry.model))
      .filter((key) => !intelligenceKeys.has(key))
    expect(orphans).toEqual([])
  })

  it('model names are unique in ai.json', () => {
    const names = intelligence.map((entry) => entry.model)
    expect(new Set(names).size).toBe(names.length)
  })

  it('ai.json is authored sorted by score descending (ties keep file order)', () => {
    // `benchtool ai-add` maintains this; the dashboard's default view and the
    // chart rely on the file order for tie-breaking.
    for (let i = 1; i < intelligence.length; i++) {
      expect(intelligence[i].score).toBeLessThanOrEqual(intelligence[i - 1].score)
    }
  })

  it('scores are integers on the 0-100 Intelligence Index scale', () => {
    for (const entry of intelligence) {
      expect(Number.isInteger(entry.score)).toBe(true)
      expect(entry.score).toBeGreaterThanOrEqual(0)
      expect(entry.score).toBeLessThanOrEqual(100)
    }
  })

  it('every ai.json row carries a hex bar color', () => {
    for (const entry of intelligence) {
      expect(entry.color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('release dates are populated and not in the future', () => {
    // ai.json tracks released models; a future date is a data-entry typo.
    const today = new Date().toISOString().slice(0, 10)
    for (const entry of intelligence) {
      expect(entry.released).not.toBeNull()
      expect(entry.released as string <= today).toBe(true)
    }
  })

  it('news URLs are unique', () => {
    const urls = news.map((entry) => entry.url)
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('machines stay ordered by VRAM descending, one row per machine', () => {
    // Data file is authored largest-first; the table defaults to VRAM desc.
    for (let i = 1; i < machines.length; i++) {
      expect(machines[i].vram_gb).toBeLessThanOrEqual(machines[i - 1].vram_gb)
    }
    const names = machines.map((entry) => entry.machine)
    expect(new Set(names).size).toBe(names.length)
  })

  it('hardware rows with an AI namesake carry that row\'s intelligence score', () => {
    // Re-derives the expected mapping independently of merge.ts, so a data
    // edit that silently breaks a match (e.g. renaming ai.json's "Nemotron 3
    // Ultra" while hardware.json keeps "Nemotron 3 Ultra 550B") fails here.
    const enriched = mergeHardwareIntelligence(hardware, intelligence)
    const scoreByKey = new Map(intelligence.map((entry) => [modelMatchKey(entry.model), entry.score]))
    for (const row of enriched) {
      const key = modelMatchKey(row.model)
      const exact = scoreByKey.get(key)
      if (exact !== undefined) {
        expect(row.intelligence_score).toBe(exact)
        continue
      }
      const prefix = [...scoreByKey.keys()].filter(
        (candidate) => candidate.startsWith(key) || key.startsWith(candidate),
      )
      if (prefix.length === 1) {
        expect(row.intelligence_score).toBe(scoreByKey.get(prefix[0]))
      } else {
        expect(row.intelligence_score).toBeNull()
      }
    }
  })
})
