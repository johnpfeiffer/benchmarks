import { describe, it, expect } from 'vitest'
import { parseModelEntries, parseNewsEntries, parseSweEntries, parseHardwareEntries } from '../parse'
import { modelMatchKey } from '../merge'
import rawIntelligenceData from '../../data/ai.json'
import rawSweData from '../../data/swe.json'
import rawNewsData from '../../data/news.json'
import rawHardwareData from '../../data/hardware.json'

describe('embedded data integrity', () => {
  const intelligence = parseModelEntries(rawIntelligenceData)
  const swe = parseSweEntries(rawSweData)
  const news = parseNewsEntries(rawNewsData)
  const hardware = parseHardwareEntries(rawHardwareData)
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

  it('includes hardware entries with 1-bit and 2-bit quant sizes, urls, and null for missing quants', () => {
    expect(hardware).toHaveLength(5)
    const inkling = hardware.find((e) => e.model === 'Inkling')
    expect(inkling).toMatchObject({
      provider: 'Thinking Machines', total_params: '264B',
      iq1_s_gb: 74.8, iq1_m_gb: 78.8,
      iq2_xxs_gb: 82.3, iq2_m_gb: 82.4,
      url: 'https://huggingface.co/unsloth/Inkling-Small-GGUF',
    })
    const kimi = hardware.find((e) => e.model === 'Kimi K3')
    expect(kimi).toMatchObject({
      provider: 'Moonshot AI', total_params: '2.8T',
      iq1_s_gb: 594, iq1_m_gb: 649,
      iq2_xxs_gb: 711, iq2_m_gb: null,
      url: 'https://huggingface.co/unsloth/Kimi-K3-GGUF',
    })
    const glm = hardware.find((e) => e.model === 'GLM-5.2 (max)')
    expect(glm).toMatchObject({
      provider: 'Z AI', total_params: '754B',
      iq1_s_gb: 217, iq1_m_gb: 228,
      iq2_xxs_gb: 238, iq2_m_gb: 239,
      url: 'https://huggingface.co/unsloth/GLM-5.2-GGUF',
    })
    const gemma = hardware.find((e) => e.model === 'Gemma 4 31B')
    expect(gemma).toMatchObject({
      provider: 'Google', total_params: '31B',
      iq1_s_gb: null, iq1_m_gb: null,
      iq2_xxs_gb: 8.53, iq2_m_gb: 10.8,
      url: 'https://huggingface.co/unsloth/gemma-4-31B-it-GGUF',
    })
    const deepseek = hardware.find((e) => e.model === 'DeepSeek V4 Flash')
    expect(deepseek).toMatchObject({
      provider: 'DeepSeek', total_params: '284B',
      iq1_s_gb: 82.5, iq1_m_gb: 86.9,
      iq2_xxs_gb: 90.9, iq2_m_gb: 90.9,
      url: 'https://huggingface.co/unsloth/DeepSeek-V4-Flash-GGUF',
    })
  })
})
