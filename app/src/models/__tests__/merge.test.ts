import { describe, expect, it } from 'vitest'
import { mergeSweMetrics, modelMatchKey } from '../merge'
import type { ModelEntry } from '../types'

const intelligenceEntries: ModelEntry[] = [
  { id: 'anthropic:claude-fable-5-with-fallback', model: 'Claude Fable 5 (with fallback)', score: 60, provider: 'Anthropic', open_weight: false },
  { id: 'openai:gpt-5.6-sol-max', model: 'GPT-5.6 Sol (max)', score: 59, provider: 'OpenAI', open_weight: false },
  { id: 'minimax:minimax-m3', model: 'MiniMax-M3', score: 44, provider: 'MiniMax', open_weight: true },
]

const sweEntries: ModelEntry[] = [
  {
    id: 'anthropic:claude-fable-5:mini-swe-agent:max',
    model: 'Claude Fable 5',
    score: 29.1,
    provider: 'Anthropic',
    open_weight: false,
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

  it('ignores the trailing asterisk marking legacy (pre-v4.1.1) scores', () => {
    expect(modelMatchKey('Claude Opus 4.8 (max)*')).toBe('claude opus 4.8')
    expect(modelMatchKey('Claude Opus 4.7*')).toBe('claude opus 4.7')
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
