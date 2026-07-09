import { describe, it, expect } from 'vitest'
import { parseModelEntries, InvariantError } from '../parse'
import type { RawModelEntry } from '../types'

const valid: RawModelEntry[] = [
  { model: 'Alpha', intelligence_score: 60, provider: 'Anthropic', reasoning: true },
  { model: 'Beta', intelligence_score: 50, provider: 'OpenAI', reasoning: true },
]

describe('parseModelEntries', () => {
  it('normalizes valid entries (intelligence_score -> score)', () => {
    const out = parseModelEntries(valid)
    expect(out).toHaveLength(2)
    expect(out[0]).toEqual({
      model: 'Alpha',
      score: 60,
      provider: 'Anthropic',
      reasoning: true,
    })
  })

  // Table-driven INV-001 cases: each row should be rejected.
  const inv001Cases: Array<{ name: string; raw: Partial<RawModelEntry> }> = [
    { name: 'missing provider', raw: { model: 'X', intelligence_score: 1 } },
    { name: 'empty provider', raw: { model: 'X', intelligence_score: 1, provider: '' } },
    { name: 'whitespace provider', raw: { model: 'X', intelligence_score: 1, provider: '   ' } },
    { name: 'non-string provider', raw: { model: 'X', intelligence_score: 1, provider: 42 as unknown as string } },
  ]

  it.each(inv001Cases)('throws InvariantError for INV-001: $name', ({ raw }) => {
    expect(() => parseModelEntries([raw as RawModelEntry])).toThrow(InvariantError)
    try {
      parseModelEntries([raw as RawModelEntry])
    } catch (e) {
      expect((e as InvariantError).invariant).toBe('INV-001')
    }
  })

  it('reports the offending index in the InvariantError', () => {
    const bad: RawModelEntry[] = [
      { model: 'Good', intelligence_score: 1, provider: 'P', reasoning: true },
      { model: 'Bad', intelligence_score: 1, provider: '', reasoning: true },
    ]
    expect(() => parseModelEntries(bad)).toThrow(InvariantError)
    try {
      parseModelEntries(bad)
    } catch (e) {
      expect((e as InvariantError).index).toBe(1)
    }
  })

  const structuralCases: Array<{ name: string; raw: Partial<RawModelEntry>; inv: string }> = [
    { name: 'missing model name', raw: { intelligence_score: 1, provider: 'P' }, inv: 'MODEL-NAME' },
    { name: 'empty model name', raw: { model: '', intelligence_score: 1, provider: 'P' }, inv: 'MODEL-NAME' },
    { name: 'non-numeric score', raw: { model: 'X', intelligence_score: 'hi' as unknown as number, provider: 'P' }, inv: 'SCORE-NUMBER' },
    { name: 'NaN score', raw: { model: 'X', intelligence_score: NaN, provider: 'P' }, inv: 'SCORE-NUMBER' },
  ]

  it.each(structuralCases)('throws for structural guard: $name', ({ raw, inv }) => {
    try {
      parseModelEntries([raw as RawModelEntry])
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(InvariantError)
      expect((e as InvariantError).invariant).toBe(inv)
    }
  })

  it('coerces reasoning to a boolean', () => {
    const out = parseModelEntries([
      { model: 'X', intelligence_score: 1, provider: 'P', reasoning: 0 as unknown as boolean },
    ])
    expect(out[0].reasoning).toBe(false)
  })

  it('rejects a non-array input', () => {
    expect(() => parseModelEntries({} as unknown as RawModelEntry[])).toThrow(InvariantError)
  })

  it('does not mutate the input array', () => {
    const input = [...valid]
    parseModelEntries(input)
    expect(input).toEqual(valid)
  })
})
