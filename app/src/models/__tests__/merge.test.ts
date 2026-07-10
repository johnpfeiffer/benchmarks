import { describe, expect, it } from 'vitest'
import { mergeSweMetrics, modelMatchKey } from '../merge'
import type { ModelEntry } from '../types'

const intelligenceEntries: ModelEntry[] = [
  { id: 'anthropic:claude-fable-5-with-fallback', model: 'Claude Fable 5 (with fallback)', score: 60, provider: 'Anthropic' },
  { id: 'openai:gpt-5.6-sol-max', model: 'GPT-5.6 Sol (max)', score: 59, provider: 'OpenAI' },
  { id: 'minimax:minimax-m3', model: 'MiniMax-M3', score: 44, provider: 'MiniMax' },
]

const sweEntries: ModelEntry[] = [
  {
    id: 'anthropic:claude-fable-5:mini-swe-agent:max',
    model: 'Claude Fable 5',
    score: 29.1,
    provider: 'Anthropic',
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
