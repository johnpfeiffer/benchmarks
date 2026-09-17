import { describe, it, expect } from 'vitest'
import { parseModelEntries, parseNewsEntries, parseHardwareEntries, parseMachineEntries } from '../parse'
import { mergeHardwareIntelligence, modelMatchKey } from '../merge'
import { aaVersionsDesc, filterByAAVersion } from '../version'
import { parseParetoDataset, paretoSnapshotFromModels } from '../pareto'
import rawIntelligenceData from '../../data/ai.json'
import rawHistoricalV402Data from '../../data/ai-2026-02-19.json'
import rawHistoricalV30Data from '../../data/ai-2025-12-30.json'
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
  const news = parseNewsEntries(rawNewsData)
  const hardware = parseHardwareEntries(rawHardwareData)
  const machines = parseMachineEntries(rawMachineData)
  // The newest index version's block: what the dashboard shows by default and
  // what hardware rows merge their scores from.
  const latest = filterByAAVersion(intelligence, aaVersionsDesc(intelligence)[0])

  it('(model, AA version) pairs are unique in ai.json', () => {
    const keys = intelligence.map((entry) => `${entry.aa_version}:${entry.model}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('ai.json groups rows newest AA version block first, score descending within a block', () => {
    // `benchtool ai-add` maintains this; the dashboard's default view and the
    // chart rely on the file order for tie-breaking within a version.
    const blocksInFile = [...new Set(intelligence.map((entry) => entry.aa_version))]
    expect(blocksInFile).toEqual(aaVersionsDesc(intelligence))
    for (const version of blocksInFile) {
      const block = filterByAAVersion(intelligence, version)
      for (let i = 1; i < block.length; i++) {
        expect(block[i].score).toBeLessThanOrEqual(block[i - 1].score)
      }
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

  it('derives a valid real Pareto default snapshot from the costed ai.json rows', () => {
    // The chart's default data comes from ai.json; this pins the derivation
    // so a data edit that empties or breaks the snapshot fails here.
    const snapshot = paretoSnapshotFromModels(intelligence)
    expect(snapshot.sample).toBe(false)
    expect(snapshot.models.length).toBeGreaterThanOrEqual(20)
    expect(() => parseParetoDataset(snapshot)).not.toThrow()
  })

  it('news URLs are unique', () => {
    const urls = news.map((entry) => entry.url)
    expect(new Set(urls).size).toBe(urls.length)
  })

  // App.tsx concatenates each historical snapshot with ai.json, so each must
  // satisfy the same per-block conventions: one version, score descending,
  // unique (model, version) pairs, a bar color and a release date on every
  // row, and no (model, version) pair shared with ai.json.
  it.each([
    ['2026-02-19', 'v4.0.2', rawHistoricalV402Data],
    ['2025-12-30', 'v3.0', rawHistoricalV30Data],
  ] as const)('the %s backfill holds only %s rows that meet the ai.json conventions', (_date, version, raw) => {
    const backfill = parseModelEntries(raw)
    expect(backfill.length).toBeGreaterThan(0)
    const keys = backfill.map((entry) => `${entry.aa_version}:${entry.model}`)
    expect(new Set(keys).size).toBe(keys.length)
    for (let i = 0; i < backfill.length; i++) {
      expect(backfill[i].aa_version).toBe(version)
      expect(backfill[i].color).toMatch(/^#[0-9a-f]{6}$/i)
      expect(backfill[i].released).not.toBeNull()
      if (i > 0) expect(backfill[i].score).toBeLessThanOrEqual(backfill[i - 1].score)
    }
    // No (model, version) pair may exist in both files.
    const mainKeys = new Set(intelligence.map((entry) => `${entry.aa_version}:${entry.model}`))
    for (const key of keys) expect(mainKeys.has(key)).toBe(false)
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
    const enriched = mergeHardwareIntelligence(hardware, latest)
    const scoreByKey = new Map(latest.map((entry) => [modelMatchKey(entry.model), entry.score]))
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
