import { describe, it, expect } from 'vitest'
import { sortModels, nextSortState, DEFAULT_SORT } from '../sort'
import type { ModelEntry, SortState } from '../types'

const entries: ModelEntry[] = [
  {
    id: 'openai:gamma',
    model: 'Gamma',
    score: 50,
    provider: 'OpenAI',
    reasoning: true,
    tasteful_solve_rate_pct: 10,
    basic_solve_rate_pct: 20,
    avg_steps: 100,
    avg_tokens: '50.5K',
  },
  {
    id: 'anthropic:alpha',
    model: 'Alpha',
    score: 60,
    provider: 'Anthropic',
    reasoning: true,
    tasteful_solve_rate_pct: 20,
    basic_solve_rate_pct: 30,
    avg_steps: 200,
    avg_tokens: '100.1K',
  },
  { id: 'openai:beta', model: 'Beta', score: 60, provider: 'OpenAI', reasoning: false },
]

describe('sortModels', () => {
  it('default sort is score desc (highest on the left)', () => {
    const sorted = sortModels(entries, DEFAULT_SORT)
    expect(sorted.map((e) => e.score)).toEqual([60, 60, 50])
    // Highest scores first; the 50 is last.
    expect(sorted[sorted.length - 1].score).toBe(50)
  })

  // Table-driven per-field cases.
  const cases: Array<{
    name: string
    sort: SortState
    expected: string[]
    key: (e: ModelEntry) => string
  }> = [
    { name: 'provider asc', sort: { field: 'provider', direction: 'asc' }, key: (e) => e.provider, expected: ['Anthropic', 'OpenAI', 'OpenAI'] },
    { name: 'provider desc', sort: { field: 'provider', direction: 'desc' }, key: (e) => e.provider, expected: ['OpenAI', 'OpenAI', 'Anthropic'] },
    { name: 'model asc', sort: { field: 'model', direction: 'asc' }, key: (e) => e.model, expected: ['Alpha', 'Beta', 'Gamma'] },
    { name: 'model desc', sort: { field: 'model', direction: 'desc' }, key: (e) => e.model, expected: ['Gamma', 'Beta', 'Alpha'] },
    { name: 'score asc', sort: { field: 'score', direction: 'asc' }, key: (e) => String(e.score), expected: ['50', '60', '60'] },
    { name: 'score desc', sort: { field: 'score', direction: 'desc' }, key: (e) => String(e.score), expected: ['60', '60', '50'] },
    { name: 'tasteful solve rate asc', sort: { field: 'tasteful_solve_rate_pct', direction: 'asc' }, key: (e) => e.model, expected: ['Gamma', 'Alpha', 'Beta'] },
    { name: 'basic solve rate desc', sort: { field: 'basic_solve_rate_pct', direction: 'desc' }, key: (e) => e.model, expected: ['Alpha', 'Gamma', 'Beta'] },
    { name: 'avg steps asc', sort: { field: 'avg_steps', direction: 'asc' }, key: (e) => e.model, expected: ['Gamma', 'Alpha', 'Beta'] },
    { name: 'avg tokens desc', sort: { field: 'avg_tokens', direction: 'desc' }, key: (e) => e.model, expected: ['Alpha', 'Gamma', 'Beta'] },
  ]

  it.each(cases)('sorts by $name', ({ sort, key, expected }) => {
    const sorted = sortModels(entries, sort)
    expect(sorted.map(key)).toEqual(expected)
  })

  it('is stable for equal keys (preserves input order)', () => {
    // Alpha and Beta both score 60; Alpha comes first in input.
    const sorted = sortModels(entries, { field: 'score', direction: 'desc' })
    const sixties = sorted.filter((e) => e.score === 60)
    expect(sixties.map((e) => e.model)).toEqual(['Alpha', 'Beta'])
  })

  it('does not mutate the input array', () => {
    const input = [...entries]
    sortModels(input, DEFAULT_SORT)
    expect(input.map((e) => e.model)).toEqual(['Gamma', 'Alpha', 'Beta'])
  })
})

describe('nextSortState', () => {
  it('toggles direction when clicking the active field', () => {
    expect(nextSortState({ field: 'score', direction: 'asc' }, 'score')).toEqual({
      field: 'score',
      direction: 'desc',
    })
    expect(nextSortState({ field: 'score', direction: 'desc' }, 'score')).toEqual({
      field: 'score',
      direction: 'asc',
    })
  })

  it('switches to a new field starting ascending', () => {
    expect(nextSortState({ field: 'score', direction: 'desc' }, 'provider')).toEqual({
      field: 'provider',
      direction: 'asc',
    })
  })
})
