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

  it('includes Claude Opus 5 (max) at intelligence 61 with a provider', () => {
    expect(intelligence.find((entry) => entry.model === 'Claude Opus 5 (max)')).toMatchObject({
      score: 61,
      provider: 'Anthropic',
    })
  })

  it('includes all news articles sorted newest first', () => {
    // The newest articles (2026-07-24) should be first.
    expect(news[0]).toEqual({
      url: 'https://artificialanalysis.ai/articles/opus-5',
      date: '2026-07-24',
    })
    // Every entry is sorted descending by date.
    for (let i = 1; i < news.length; i++) {
      expect(news[i].date <= news[i - 1].date).toBe(true)
    }
    // All expected URLs are present.
    const urls = new Set(news.map((entry) => entry.url))
    expect(urls.has('https://artificialanalysis.ai/articles/opus-5')).toBe(true)
    expect(urls.has('https://www.coderabbit.ai/blog/opus-5-model-review')).toBe(true)
    expect(urls.has('https://fireworks.ai/blog/kimik3-fable')).toBe(true)
    expect(urls.has('https://www.anthropic.com/news/claude-fable-5-mythos-5')).toBe(true)
    expect(urls.has('https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/')).toBe(true)
    // The Gemini Flash article date was corrected to 2026-07-21.
    const geminiArticle = news.find(
      (entry) => entry.url === 'https://artificialanalysis.ai/articles/gemini-3-6-flash-3-5-flash-lite-halving-time',
    )
    expect(geminiArticle?.date).toBe('2026-07-21')
    expect(news).toHaveLength(15)
  })
})
