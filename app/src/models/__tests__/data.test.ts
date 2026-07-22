import { describe, it, expect } from 'vitest'
import { parseModelEntries, parseNewsEntries, parseSweEntries } from '../parse'
import { modelMatchKey } from '../merge'
import rawIntelligenceData from '../../data/ai.json'
import rawSweData from '../../data/swe.json'
import rawNewsData from '../../data/news.json'

describe('embedded data integrity', () => {
  const intelligence = parseModelEntries(rawIntelligenceData)
  const swe = parseSweEntries(rawSweData)
  const news = parseNewsEntries(rawNewsData)
  const intelligenceKeys = new Set(intelligence.map((entry) => modelMatchKey(entry.model)))

  it('every Senior SWE Bench model has a matching Artificial Analysis row', () => {
    // Regression: SWE-only models (Claude Opus 4.7, GPT-5.4, Claude Sonnet 4.6)
    // previously had no AI counterpart, so the "Open Weights Only" preset
    // (which deselects non-open-weight AI models) never removed them from the
    // SWE charts. Every SWE model must now match an AI row so the selection
    // propagates fully.
    const orphans = swe
      .map((entry) => modelMatchKey(entry.model))
      .filter((key) => !intelligenceKeys.has(key))
    expect(orphans).toEqual([])
  })

  it('incorporates the SWE-only models into the main table as not-open-weight', () => {
    const find = (name: string) => intelligence.find((entry) => entry.model === name)

    const claudeOpus47 = find('Claude Opus 4.7')
    expect(claudeOpus47).toBeDefined()
    expect(claudeOpus47?.score).toBe(54)
    expect(claudeOpus47?.open_weight).toBe(false)

    const gpt54 = find('GPT-5.4 (xhigh)')
    expect(gpt54).toBeDefined()
    expect(gpt54?.score).toBe(51)
    expect(gpt54?.open_weight).toBe(false)

    const claudeSonnet46 = find('Claude Sonnet 4.6')
    expect(claudeSonnet46).toBeDefined()
    expect(claudeSonnet46?.score).toBe(47)
    expect(claudeSonnet46?.open_weight).toBe(false)
  })

  it('includes Gemini Flash 3.6 at intelligence 50 with a provider', () => {
    expect(intelligence.find((entry) => entry.model === 'Gemini Flash 3.6')).toMatchObject({
      score: 50,
      provider: 'Google',
    })
  })

  it('includes the initial dated news article', () => {
    expect(news).toEqual([
      {
        url: 'https://artificialanalysis.ai/articles/gemini-3-6-flash-3-5-flash-lite-halving-time',
        date: '2026-07-26',
      },
    ])
  })
})
