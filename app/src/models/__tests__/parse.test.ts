import { describe, it, expect } from 'vitest'
import { parseModelEntries, parseSweEntries, inferProviderFromModel, isOpenWeightModel, InvariantError } from '../parse'
import type { RawModelEntry, RawSweEntry } from '../types'

const valid: RawModelEntry[] = [
  { model: 'Alpha', intelligence_score: 60, provider: 'Anthropic', reasoning: true, open_weight: true },
  { model: 'Beta', intelligence_score: 50, provider: 'OpenAI', reasoning: true },
]

describe('parseModelEntries', () => {
  it('normalizes valid entries (intelligence_score -> score)', () => {
    const out = parseModelEntries(valid)
    expect(out).toHaveLength(2)
    expect(out[0]).toEqual({
      id: 'anthropic:alpha',
      model: 'Alpha',
      score: 60,
      provider: 'Anthropic',
      reasoning: true,
      open_weight: true,
    })
  })

  it('defaults open_weight to false when the raw field is missing', () => {
    const out = parseModelEntries(valid)
    expect(out[1].open_weight).toBe(false)
  })

  it('coerces open_weight to a boolean', () => {
    const out = parseModelEntries([
      { model: 'X', intelligence_score: 1, provider: 'P', reasoning: true, open_weight: 1 as unknown as boolean },
    ])
    expect(out[0].open_weight).toBe(true)
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

describe('parseSweEntries', () => {
  const validSwe: RawSweEntry[] = [
    {
      rank: 1,
      model: 'Claude Fable 5',
      harness: 'Mini-SWE-Agent',
      effort: 'max',
      tasteful_solve_rate_pct: 29.1,
      basic_solve_rate_pct: 46.5,
      avg_steps: 159,
      avg_tokens: '290.2K',
    },
    {
      rank: 2,
      model: 'GPT-5.6 Sol',
      harness: 'Mini-SWE-Agent',
      effort: 'xhigh',
      tasteful_solve_rate_pct: 24.4,
      basic_solve_rate_pct: 54.7,
      avg_steps: 49,
      avg_tokens: '31.1K',
    },
  ]

  it('normalizes SWE rows using tasteful solve rate as score', () => {
    const out = parseSweEntries(validSwe)
    expect(out[0]).toMatchObject({
      id: 'anthropic:claude-fable-5:mini-swe-agent:max',
      model: 'Claude Fable 5',
      score: 29.1,
      provider: 'Anthropic',
      tasteful_solve_rate_pct: 29.1,
      basic_solve_rate_pct: 46.5,
      avg_steps: 159,
      avg_tokens: '290.2K',
    })
  })

  it('derives providers from known model families', () => {
    expect(inferProviderFromModel('Claude Opus 4.8')).toBe('Anthropic')
    expect(inferProviderFromModel('GPT-5.6 Sol')).toBe('OpenAI')
    expect(inferProviderFromModel('Grok 4.5')).toBe('xAI')
    expect(inferProviderFromModel('GLM-5.2')).toBe('Z AI')
    expect(inferProviderFromModel('Kimi K2.6')).toBe('Moonshot AI')
    expect(inferProviderFromModel('Gemini 3.5 Flash')).toBe('Google')
  })

  it('rejects unknown SWE model families as INV-001 violations', () => {
    const bad = [{ ...validSwe[0], model: 'Mystery Model' }]
    expect(() => parseSweEntries(bad)).toThrow(InvariantError)
    try {
      parseSweEntries(bad)
    } catch (e) {
      expect((e as InvariantError).invariant).toBe('INV-001')
    }
  })

  it('infers open_weight for SWE rows from the model family', () => {
    const out = parseSweEntries([
      { ...validSwe[0], model: 'Kimi K2.6' },
      { ...validSwe[1], model: 'GLM-5.2' },
      { ...validSwe[0], model: 'Claude Opus 4.8' },
    ])
    expect(out[0].open_weight).toBe(true)
    expect(out[1].open_weight).toBe(true)
    expect(out[2].open_weight).toBe(false)
  })
})

describe('isOpenWeightModel', () => {
  // Table-driven: each model family the user listed as open-weight.
  const openWeightCases: Array<{ name: string; expected: boolean }> = [
    { name: 'Kimi K2.6', expected: true },
    { name: 'MiniMax-M3', expected: true },
    { name: 'DeepSeek V4 Pro (max)', expected: true },
    { name: 'Nemotron 3 Ultra', expected: true },
    { name: 'Qwen3.6 27B', expected: true },
    { name: 'GLM-5.2 (max)', expected: true },
    { name: 'GLM-4.7', expected: true },
    { name: 'Mistral Medium 3.5', expected: true },
    { name: 'Gemma 4 31B', expected: true },
    { name: 'gpt-oss-120b (high)', expected: true },
    { name: 'Claude Fable 5 (with fallback)', expected: false },
    { name: 'GPT-5.6 Sol (max)', expected: false },
    { name: 'Grok 4.5 (high)', expected: false },
    { name: 'Gemini 3.5 Flash', expected: false },
  ]

  it.each(openWeightCases)('$name -> open_weight $expected', ({ name, expected }) => {
    expect(isOpenWeightModel(name)).toBe(expected)
  })

  it('is case-insensitive', () => {
    expect(isOpenWeightModel('kimi k2.6')).toBe(true)
    expect(isOpenWeightModel('QWEN3.5 397B')).toBe(true)
  })
})
