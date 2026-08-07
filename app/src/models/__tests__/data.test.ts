import { describe, it, expect } from 'vitest'
import { parseModelEntries, parseNewsEntries, parseSweEntries, parseHardwareEntries, parseGpuEntries } from '../parse'
import { modelMatchKey } from '../merge'
import rawIntelligenceData from '../../data/ai.json'
import rawSweData from '../../data/swe.json'
import rawNewsData from '../../data/news.json'
import rawHardwareData from '../../data/hardware.json'
import rawGpuData from '../../data/gpu.json'

describe('embedded data integrity', () => {
  const intelligence = parseModelEntries(rawIntelligenceData)
  const swe = parseSweEntries(rawSweData)
  const news = parseNewsEntries(rawNewsData)
  const hardware = parseHardwareEntries(rawHardwareData)
  const gpu = parseGpuEntries(rawGpuData)
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

    const claudeOpus47 = find('Claude Opus 4.7 (max)')
    expect(claudeOpus47).toBeDefined()
    expect(claudeOpus47?.score).toBe(55)
    expect(claudeOpus47?.open_weight).toBe(false)

    const gpt54 = find('GPT-5.4 (xhigh)')
    expect(gpt54).toBeDefined()
    expect(gpt54?.score).toBe(53)
    expect(gpt54?.open_weight).toBe(false)

    const claudeSonnet46 = find('Claude Sonnet 4.6 (max)')
    expect(claudeSonnet46).toBeDefined()
    expect(claudeSonnet46?.score).toBe(48)
    expect(claudeSonnet46?.open_weight).toBe(false)
  })

  it('includes Claude Fable 5 (max) renamed from with-fallback', () => {
    expect(intelligence.find((entry) => entry.model === 'Claude Fable 5 (max)')).toMatchObject({
      score: 62,
      provider: 'Anthropic',
    })
    expect(intelligence.find((entry) => entry.model === 'Claude Fable 5 (with fallback)')).toBeUndefined()
  })

  it('has 19 SWE entries with updated values from senior-swe-bench.snorkel.ai', () => {
    expect(swe).toHaveLength(19)
    // New entries
    const opus5 = swe.find((e) => e.model === 'Claude Opus 5')
    expect(opus5).toMatchObject({ tasteful_solve_rate_pct: 34.7, basic_solve_rate_pct: 62.1, avg_steps: 141, avg_tokens: '71.0K' })
    const terra = swe.find((e) => e.model === 'GPT-5.6 Terra')
    expect(terra).toMatchObject({ tasteful_solve_rate_pct: 27.4, basic_solve_rate_pct: 36.8, avg_steps: 36, avg_tokens: '18.2K' })
    const minimax = swe.find((e) => e.model === 'MiniMax-M3')
    expect(minimax).toMatchObject({ tasteful_solve_rate_pct: 21.1, basic_solve_rate_pct: 41.1, avg_steps: 335, avg_tokens: '75.8K' })
    const kimiK3 = swe.find((e) => e.model === 'Kimi K3')
    expect(kimiK3).toMatchObject({ tasteful_solve_rate_pct: 20.2, basic_solve_rate_pct: 40.4, avg_steps: 224, avg_tokens: '54.8K' })
    const luna = swe.find((e) => e.model === 'GPT-5.6 Luna')
    expect(luna).toMatchObject({ tasteful_solve_rate_pct: 8.1, basic_solve_rate_pct: 20.3, avg_steps: 14, avg_tokens: '2.6K' })
    const inkling = swe.find((e) => e.model === 'Inkling')
    expect(inkling).toMatchObject({ tasteful_solve_rate_pct: 0.0, basic_solve_rate_pct: 3.2, avg_steps: 51, avg_tokens: '3.4K' })
    // Updated entries
    const fable = swe.find((e) => e.model === 'Claude Fable 5')
    expect(fable).toMatchObject({ tasteful_solve_rate_pct: 34.7, basic_solve_rate_pct: 53.7, avg_steps: 119, avg_tokens: '58.4K' })
    const sol = swe.find((e) => e.model === 'GPT-5.6 Sol')
    expect(sol).toMatchObject({ tasteful_solve_rate_pct: 34.7, basic_solve_rate_pct: 53.7, avg_steps: 50, avg_tokens: '32.7K' })
    const opus48 = swe.find((e) => e.model === 'Claude Opus 4.8')
    expect(opus48).toMatchObject({ tasteful_solve_rate_pct: 30.5, basic_solve_rate_pct: 44.2, avg_steps: 138, avg_tokens: '134.2K' })
    const glm = swe.find((e) => e.model === 'GLM-5.2')
    expect(glm).toMatchObject({ tasteful_solve_rate_pct: 17.9, basic_solve_rate_pct: 35.8, avg_steps: 194, avg_tokens: '66.2K' })
    const gemini35 = swe.find((e) => e.model === 'Gemini 3.5 Flash')
    expect(gemini35).toMatchObject({ tasteful_solve_rate_pct: 6.3, basic_solve_rate_pct: 22.1, avg_steps: 231, avg_tokens: '70.4K' })
    const gemini31 = swe.find((e) => e.model === 'Gemini 3.1 Pro')
    expect(gemini31).toMatchObject({ tasteful_solve_rate_pct: 2.1, basic_solve_rate_pct: 9.5, avg_steps: 108, avg_tokens: '17.3K' })
    const sonnet46 = swe.find((e) => e.model === 'Claude Sonnet 4.6')
    expect(sonnet46).toMatchObject({ tasteful_solve_rate_pct: 0.0, basic_solve_rate_pct: 0.0, avg_steps: 0, avg_tokens: 'n/a' })
  })

  it('includes Gemini Flash 3.6 at intelligence 52 with a provider', () => {
    expect(intelligence.find((entry) => entry.model === 'Gemini Flash 3.6')).toMatchObject({
      score: 52,
      provider: 'Google',
    })
  })

  it('includes Claude Opus 5 (max) at intelligence 63 with a provider', () => {
    expect(intelligence.find((entry) => entry.model === 'Claude Opus 5 (max)')).toMatchObject({
      score: 63,
      provider: 'Anthropic',
    })
  })

  it('includes Qwen3.8 Max as an open-weight Alibaba model at intelligence 58', () => {
    expect(intelligence.find((entry) => entry.model === 'Qwen3.8 Max')).toMatchObject({
      score: 58,
      provider: 'Alibaba',
      open_weight: true,
    })
  })

  it('no longer includes GLM-4.7 (dropped from the v4.1.1 leaderboard)', () => {
    expect(intelligence.find((entry) => entry.model === 'GLM-4.7')).toBeUndefined()
  })

  it('includes all news articles sorted newest first', () => {
    // The newest article (2026-07-31) should be first.
    expect(news[0]).toEqual({
      url: 'https://artificialanalysis.ai/articles/deepseek-v4-flash-0731-scores-50-on-the-artificial-analysis-intelligence-index-10-points-above-previous-deepseek-v4-flash',
      date: '2026-07-31',
    })
    // Every entry is sorted descending by date.
    for (let i = 1; i < news.length; i++) {
      expect(news[i].date <= news[i - 1].date).toBe(true)
    }
    // All expected URLs are present.
    const urls = new Set(news.map((entry) => entry.url))
    expect(urls.has('https://artificialanalysis.ai/articles/deepseek-v4-flash-0731-scores-50-on-the-artificial-analysis-intelligence-index-10-points-above-previous-deepseek-v4-flash')).toBe(true)
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
    expect(news).toHaveLength(16)
  })

  it('includes hardware entries with 1-bit and 2-bit quant sizes, urls, and null for missing quants', () => {
    expect(hardware).toHaveLength(6)
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
    const deepseek = hardware.find((e) => e.model === 'DeepSeek V4 Flash 0731')
    expect(deepseek).toMatchObject({
      provider: 'DeepSeek', total_params: '284B',
      iq1_s_gb: 82.5, iq1_m_gb: 86.9,
      iq2_xxs_gb: 90.9, iq2_m_gb: 90.9,
      url: 'https://huggingface.co/unsloth/DeepSeek-V4-Flash-0731-GGUF',
    })
    const nemotron = hardware.find((e) => e.model === 'Nemotron 3 Ultra 550B')
    expect(nemotron).toMatchObject({
      provider: 'NVIDIA', total_params: '550B',
      iq1_s_gb: null, iq1_m_gb: 188,
      iq2_xxs_gb: null, iq2_m_gb: null,
      url: 'https://huggingface.co/unsloth/NVIDIA-Nemotron-3-Ultra-550B-A55B-GGUF',
    })
  })

  it('includes GPU entries with specs and null for missing values', () => {
    expect(gpu).toHaveLength(14)
    const h100sxm = gpu.find((e) => e.model === 'H100 (SXM)')
    expect(h100sxm).toMatchObject({
      date: '2022-10', memory: '80 GB', memory_type: 'HBM3',
      memory_bandwidth_gbs: 3355, fp16_tflops: 990,
    })
    const a100sxm = gpu.find((e) => e.model === 'A100 (SXM)')
    expect(a100sxm).toMatchObject({
      date: '2020', memory: '40-80 GB', memory_type: 'HBM2e',
      memory_bandwidth_gbs: 1555, fp16_tflops: 312,
    })
    const b200 = gpu.find((e) => e.model === 'B200 (SXM)')
    expect(b200).toMatchObject({
      date: '2024-03', memory: '192 GB', memory_type: 'HBM3e',
      memory_bandwidth_gbs: 8000, fp16_tflops: 2250,
    })
    const rtxpro = gpu.find((e) => e.model === 'RTX Pro 4000 Blackwell')
    expect(rtxpro).toMatchObject({
      date: '2025-03', memory: '24 GB', memory_type: 'GDDR7',
      memory_bandwidth_gbs: 672, fp16_tflops: 322,
    })
    const v100 = gpu.find((e) => e.model === 'Tesla V100')
    expect(v100).toMatchObject({
      date: '2017', memory: '32 GB', memory_type: 'HBM2',
      memory_bandwidth_gbs: 900, fp16_tflops: 125,
    })
  })
})
