import { describe, it, expect } from 'vitest'
import { openWeightIds } from '../filter'
import type { ModelEntry } from '../types'

const entries: ModelEntry[] = [
  { id: 'anthropic:alpha', model: 'Alpha', score: 60, provider: 'Anthropic', open_weight: true },
  { id: 'openai:beta', model: 'Beta', score: 50, provider: 'OpenAI', open_weight: false },
  { id: 'google:gamma', model: 'Gamma', score: 55, provider: 'Google', open_weight: true },
  { id: 'xai:delta', model: 'Delta', score: 40, provider: 'xAI', open_weight: false },
]

describe('openWeightIds', () => {
  it('returns the ids of entries whose weights are open', () => {
    expect(openWeightIds(entries)).toEqual(new Set(['anthropic:alpha', 'google:gamma']))
  })

  it('returns an empty set when no entries are open-weight', () => {
    const closed = entries.filter((entry) => !entry.open_weight)
    expect(openWeightIds(closed)).toEqual(new Set())
  })

  it('returns an empty set for empty input', () => {
    expect(openWeightIds([])).toEqual(new Set())
  })

  it('does not mutate the input', () => {
    const input = [...entries]
    openWeightIds(input)
    expect(input).toEqual(entries)
  })
})
