import { describe, it, expect } from 'vitest'
import { parseModelEntries, parseMachineEntries, InvariantError } from '../parse'
import type { RawMachineEntry, RawModelEntry } from '../types'

const valid: RawModelEntry[] = [
  { model: 'Alpha', intelligence_score: 60, provider: 'Anthropic', open_weight: true },
  { model: 'Beta', intelligence_score: 50, provider: 'OpenAI' },
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
      open_weight: true,
      released: null,
    })
  })

  it('passes through a valid ISO release date', () => {
    const out = parseModelEntries([
      { model: 'X', intelligence_score: 1, provider: 'P', released: '2026-09-01' },
    ])
    expect(out[0].released).toBe('2026-09-01')
  })

  it('defaults released to null when the raw field is missing or null', () => {
    const out = parseModelEntries([
      { model: 'X', intelligence_score: 1, provider: 'P' },
      { model: 'Y', intelligence_score: 2, provider: 'P', released: null },
    ])
    expect(out[0].released).toBeNull()
    expect(out[1].released).toBeNull()
  })

  it.each([
    { name: 'non-ISO string', released: 'September 1, 2026' },
    { name: 'impossible date', released: '2026-02-30' },
    { name: 'partial date', released: '2026-09' },
    { name: 'non-string', released: 20260901 },
  ])('rejects a bad release date: $name', ({ released }) => {
    try {
      parseModelEntries([
        { model: 'X', intelligence_score: 1, provider: 'P', released: released as unknown as string },
      ])
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(InvariantError)
      expect((e as InvariantError).invariant).toBe('MODEL-RELEASED')
    }
  })

  it('defaults open_weight to false when the raw field is missing', () => {
    const out = parseModelEntries(valid)
    expect(out[1].open_weight).toBe(false)
  })

  it('coerces open_weight to a boolean', () => {
    const out = parseModelEntries([
      { model: 'X', intelligence_score: 1, provider: 'P', open_weight: 1 as unknown as boolean },
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
      { model: 'Good', intelligence_score: 1, provider: 'P' },
      { model: 'Bad', intelligence_score: 1, provider: '' },
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

  it('rejects a non-array input', () => {
    expect(() => parseModelEntries({} as unknown as RawModelEntry[])).toThrow(InvariantError)
  })

  it('does not mutate the input array', () => {
    const input = [...valid]
    parseModelEntries(input)
    expect(input).toEqual(valid)
  })
})

describe('parseMachineEntries', () => {
  const validMachines: RawMachineEntry[] = [
    {
      machine: 'Mac Studio (M5 Ultra, 2026)',
      chip: 'Apple M5 Ultra',
      vram_gb: 256,
      memory_bandwidth_gbs: 1200,
      price_usd: 9499,
      url: 'https://example.com/mac-studio',
    },
    {
      machine: 'NVIDIA DGX Spark',
      chip: 'NVIDIA GB10 Grace Blackwell',
      vram_gb: 128,
      memory_bandwidth_gbs: 273,
      price_usd: 4699,
      url: 'https://example.com/dgx-spark',
    },
  ]

  it('normalizes valid entries', () => {
    const out = parseMachineEntries(validMachines)
    expect(out).toHaveLength(2)
    expect(out[0]).toEqual({
      machine: 'Mac Studio (M5 Ultra, 2026)',
      chip: 'Apple M5 Ultra',
      vram_gb: 256,
      memory_bandwidth_gbs: 1200,
      price_usd: 9499,
      url: 'https://example.com/mac-studio',
    })
  })

  it('coerces missing optional bandwidth and price to null', () => {
    const out = parseMachineEntries([
      { machine: 'X', chip: 'C', vram_gb: 32, url: 'https://example.com/x' } as unknown as RawMachineEntry,
    ])
    expect(out[0].memory_bandwidth_gbs).toBeNull()
    expect(out[0].price_usd).toBeNull()
  })

  // Table-driven structural guard cases: each row should be rejected.
  const structuralCases: Array<{ name: string; raw: Partial<RawMachineEntry>; inv: string }> = [
    { name: 'missing machine name', raw: { chip: 'C', vram_gb: 1, url: 'https://example.com' }, inv: 'MACHINE-NAME' },
    { name: 'empty machine name', raw: { machine: '  ', chip: 'C', vram_gb: 1, url: 'https://example.com' }, inv: 'MACHINE-NAME' },
    { name: 'missing chip', raw: { machine: 'X', vram_gb: 1, url: 'https://example.com' }, inv: 'MACHINE-CHIP' },
    { name: 'non-numeric vram_gb', raw: { machine: 'X', chip: 'C', vram_gb: 'lots' as unknown as number, url: 'https://example.com' }, inv: 'MACHINE-VRAM' },
    { name: 'NaN vram_gb', raw: { machine: 'X', chip: 'C', vram_gb: NaN, url: 'https://example.com' }, inv: 'MACHINE-VRAM' },
    { name: 'missing url', raw: { machine: 'X', chip: 'C', vram_gb: 1 }, inv: 'MACHINE-URL' },
    { name: 'empty url', raw: { machine: 'X', chip: 'C', vram_gb: 1, url: '' }, inv: 'MACHINE-URL' },
  ]

  it.each(structuralCases)('throws for structural guard: $name', ({ raw, inv }) => {
    try {
      parseMachineEntries([raw as RawMachineEntry])
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(InvariantError)
      expect((e as InvariantError).invariant).toBe(inv)
    }
  })

  it('reports the offending index in the InvariantError', () => {
    const bad: RawMachineEntry[] = [
      validMachines[0],
      { machine: '', chip: 'C', vram_gb: 1, memory_bandwidth_gbs: null, price_usd: null, url: 'https://example.com' },
    ]
    try {
      parseMachineEntries(bad)
      throw new Error('should have thrown')
    } catch (e) {
      expect((e as InvariantError).index).toBe(1)
    }
  })

  it('rejects a non-array input', () => {
    expect(() => parseMachineEntries({} as unknown as RawMachineEntry[])).toThrow(InvariantError)
  })

  it('does not mutate the input array', () => {
    const input = [...validMachines]
    parseMachineEntries(input)
    expect(input).toEqual(validMachines)
  })
})
