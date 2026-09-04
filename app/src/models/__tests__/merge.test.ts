import { describe, expect, it } from 'vitest'
import { mergeHardwareIntelligence, mergeSweMetrics, modelMatchKey } from '../merge'
import type { HardwareEntry, ModelEntry } from '../types'

const intelligenceEntries: ModelEntry[] = [
  { id: 'anthropic:claude-fable-5-with-fallback', model: 'Claude Fable 5 (with fallback)', score: 60, provider: 'Anthropic', open_weight: false, released: null },
  { id: 'openai:gpt-5.6-sol-max', model: 'GPT-5.6 Sol (max)', score: 59, provider: 'OpenAI', open_weight: false, released: null },
  { id: 'minimax:minimax-m3', model: 'MiniMax-M3', score: 44, provider: 'MiniMax', open_weight: true, released: null },
]

const sweEntries: ModelEntry[] = [
  {
    id: 'anthropic:claude-fable-5:mini-swe-agent:max',
    model: 'Claude Fable 5',
    score: 29.1,
    provider: 'Anthropic',
    open_weight: false,
    released: null,
    tasteful_solve_rate_pct: 29.1,
    basic_solve_rate_pct: 46.5,
    avg_steps: 159,
    avg_tokens: '290.2K',
  },
  {
    id: 'openai:gpt-5.6-sol:mini-swe-agent:xhigh',
    model: 'GPT-5.6 Sol',
    score: 24.4,
    provider: 'OpenAI',
    open_weight: false,
    released: null,
    tasteful_solve_rate_pct: 24.4,
    basic_solve_rate_pct: 54.7,
    avg_steps: 49,
    avg_tokens: '31.1K',
  },
]

describe('mergeSweMetrics', () => {
  it('matches model names after parenthetical suffixes are removed', () => {
    expect(modelMatchKey('GPT-5.6 Sol (max)')).toBe('gpt-5.6 sol')
    expect(modelMatchKey('Gemini 3.1 Pro Preview')).toBe('gemini 3.1 pro')
  })

  it('adds SWE metrics to matching intelligence rows', () => {
    const merged = mergeSweMetrics(intelligenceEntries, sweEntries)
    expect(merged[0]).toMatchObject({
      model: 'Claude Fable 5 (with fallback)',
      tasteful_solve_rate_pct: 29.1,
      basic_solve_rate_pct: 46.5,
      avg_steps: 159,
      avg_tokens: '290.2K',
    })
    expect(merged[1].tasteful_solve_rate_pct).toBe(24.4)
  })

  it('leaves unmatched intelligence rows without SWE metrics', () => {
    const merged = mergeSweMetrics(intelligenceEntries, sweEntries)
    expect(merged[2].tasteful_solve_rate_pct).toBeUndefined()
    expect(merged[2].avg_tokens).toBeUndefined()
  })
})

describe('mergeHardwareIntelligence', () => {
  const ai: ModelEntry[] = [
    { id: 'openai:gpt-5.6-sol-max', model: 'GPT-5.6 Sol (max)', score: 59, provider: 'OpenAI', open_weight: false, released: null },
    { id: 'openai:gpt-5.6-terra-max', model: 'GPT-5.6 Terra (max)', score: 56, provider: 'OpenAI', open_weight: false, released: null },
    { id: 'minimax:minimax-m3', model: 'MiniMax-M3', score: 44, provider: 'MiniMax', open_weight: true, released: null },
  ]
  const hardwareRow = (model: string): HardwareEntry => ({
    model,
    provider: 'X',
    total_params: '1B',
    iq1_s_gb: null,
    iq1_m_gb: null,
    iq2_xxs_gb: null,
    iq2_m_gb: null,
    url: 'https://huggingface.co/unsloth/x',
  })

  it('attaches scores by normalized model name', () => {
    const merged = mergeHardwareIntelligence([hardwareRow('GPT-5.6 Sol')], ai)
    expect(merged[0].intelligence_score).toBe(59)
  })

  it('falls back to a unique prefix match for extra size suffixes', () => {
    const merged = mergeHardwareIntelligence([hardwareRow('MiniMax-M3 397B')], ai)
    expect(merged[0].intelligence_score).toBe(44)
  })

  it('leaves ambiguous prefix matches null', () => {
    const merged = mergeHardwareIntelligence([hardwareRow('GPT-5.6')], ai)
    expect(merged[0].intelligence_score).toBeNull()
  })

  it('leaves unmatched rows null', () => {
    const merged = mergeHardwareIntelligence([hardwareRow('Unknown Model')], ai)
    expect(merged[0].intelligence_score).toBeNull()
  })
})
