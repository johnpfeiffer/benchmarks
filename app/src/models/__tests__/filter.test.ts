import { describe, it, expect } from 'vitest'
import { openWeightIds, presetSelectionIds } from '../filter'
import type { ModelEntry } from '../types'

const entries: ModelEntry[] = [
  { id: 'anthropic:alpha', model: 'Alpha', score: 60, aa_version: 'v9.9', provider: 'Anthropic', open_weight: true, released: null },
  { id: 'openai:beta', model: 'Beta', score: 50, aa_version: 'v9.9', provider: 'OpenAI', open_weight: false, released: null },
  { id: 'google:gamma', model: 'Gamma', score: 55, aa_version: 'v9.9', provider: 'Google', open_weight: true, released: null },
  { id: 'xai:delta', model: 'Delta', score: 40, aa_version: 'v9.9', provider: 'xAI', open_weight: false, released: null },
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

describe('presetSelectionIds', () => {
  it('returns every id when no provider is chosen and open weights is off', () => {
    expect(presetSelectionIds(entries, new Set(), false)).toEqual(
      new Set(['anthropic:alpha', 'openai:beta', 'google:gamma', 'xai:delta']),
    )
  })

  it('returns one provider’s ids for a single chosen provider', () => {
    expect(presetSelectionIds(entries, new Set(['Google']), false)).toEqual(new Set(['google:gamma']))
  })

  it('unions multiple chosen providers (additive)', () => {
    expect(presetSelectionIds(entries, new Set(['Google', 'xAI']), false)).toEqual(
      new Set(['google:gamma', 'xai:delta']),
    )
  })

  it('intersects chosen providers with the open-weights preset', () => {
    expect(presetSelectionIds(entries, new Set(['Google', 'xAI']), true)).toEqual(new Set(['google:gamma']))
  })

  it('applies the open-weights preset alone when no provider is chosen', () => {
    expect(presetSelectionIds(entries, new Set(), true)).toEqual(new Set(['anthropic:alpha', 'google:gamma']))
  })

  it('returns an empty set when a chosen provider has no rows', () => {
    expect(presetSelectionIds(entries, new Set(['Meta']), false)).toEqual(new Set())
  })

  it('does not mutate the inputs', () => {
    const input = [...entries]
    const providers = new Set(['Google'])
    presetSelectionIds(input, providers, false)
    expect(input).toEqual(entries)
    expect(providers).toEqual(new Set(['Google']))
  })
})
