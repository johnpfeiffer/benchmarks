import { describe, expect, it } from 'vitest'
import { paretoFrontier, parseParetoDataset, meetsParetoTarget } from '../pareto'

const rows = [
  { model: 'Cheap', provider: 'A', intelligence: 40, cost_usd: 100 },
  { model: 'Worse at same cost', provider: 'B', intelligence: 35, cost_usd: 100 },
  { model: 'Same score, dearer', provider: 'A', intelligence: 40, cost_usd: 200 },
  { model: 'Balanced', provider: 'B', intelligence: 50, cost_usd: 300 },
  { model: 'Identical tradeoff', provider: 'C', intelligence: 50, cost_usd: 300 },
  { model: 'Best', provider: 'A', intelligence: 60, cost_usd: 1000 },
]
const dataset = { benchmark_version: 'test', date: '2026-09-06', sample: true, models: rows }

describe('Pareto comparison', () => {
  it('keeps nondominated ties and orders the frontier by increasing cost without mutating input', () => {
    const points = parseParetoDataset(dataset).models.reverse()
    const before = [...points]
    expect(paretoFrontier(points).map(p => p.model)).toEqual(['Cheap', 'Identical tradeoff', 'Balanced', 'Best'])
    expect(points).toEqual(before)
  })

  it('uses strict thresholds independently of frontier membership', () => {
    expect(meetsParetoTarget(rows[0], 200, 35)).toBe(true)
    expect(meetsParetoTarget(rows[0], 100, 35)).toBe(false)
    expect(meetsParetoTarget(rows[0], 200, 40)).toBe(false)
  })

  it.each([
    { provider: '' }, { cost_usd: 0 }, { cost_usd: -1 }, { cost_usd: Infinity },
    { intelligence: NaN }, { intelligence: 101 }, { intelligence: -1 }, { model: '' },
  ])('rejects unusable points: %j', (change) => {
    expect(() => parseParetoDataset({ ...dataset, models: [{ ...rows[0], ...change }] })).toThrow()
  })

  it('requires a version, valid date, explicit sample flag and nonempty unique model variants', () => {
    for (const change of [{ benchmark_version: '' }, { date: '2026-02-30' }, { sample: undefined }, { models: [] }, { models: [rows[0], rows[0]] }]) {
      expect(() => parseParetoDataset({ ...dataset, ...change })).toThrow()
    }
  })
})
