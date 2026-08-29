import { describe, it, expect } from 'vitest'
import { parseModelEntries, parseNewsEntries, parseSweEntries, parseHardwareEntries, parseGpuEntries, parseMachineEntries } from '../parse'
import { mergeHardwareIntelligence, modelMatchKey } from '../merge'
import rawIntelligenceData from '../../data/ai.json'
import rawSweData from '../../data/swe.json'
import rawNewsData from '../../data/news.json'
import rawHardwareData from '../../data/hardware.json'
import rawGpuData from '../../data/gpu.json'
import rawMachineData from '../../data/machines.json'

describe('embedded data integrity', () => {
  const intelligence = parseModelEntries(rawIntelligenceData)
  const swe = parseSweEntries(rawSweData)
  const news = parseNewsEntries(rawNewsData)
  const hardware = parseHardwareEntries(rawHardwareData)
  const gpu = parseGpuEntries(rawGpuData)
  const machines = parseMachineEntries(rawMachineData)
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

  it('has 21 SWE entries with updated values from senior-swe-bench.snorkel.ai', () => {
    expect(swe).toHaveLength(21)
    // New entries
    const grok46 = swe.find((e) => e.model === 'Grok 4.6')
    expect(grok46).toMatchObject({ tasteful_solve_rate_pct: 26.3, basic_solve_rate_pct: 51.6, avg_steps: 125, avg_tokens: '23.9K' })
    expect(grok46?.id).toBe('xai:grok-4.6:mini-swe-agent:high')
    const gemini37 = swe.find((e) => e.model === 'Gemini 3.7 Flash')
    expect(gemini37).toMatchObject({ tasteful_solve_rate_pct: 14.7, basic_solve_rate_pct: 44.2, avg_steps: 254, avg_tokens: '47.3K' })
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
    // Grok 4.5 was re-run at medium effort (previously high: 17.2/49.4, 80 steps, 22.9K).
    const grok = swe.find((e) => e.model === 'Grok 4.5')
    expect(grok).toMatchObject({ tasteful_solve_rate_pct: 23.2, basic_solve_rate_pct: 50.5, avg_steps: 72, avg_tokens: '21.2K' })
    // The effort level is not a ModelEntry field; it is baked into the id.
    expect(grok?.id).toBe('xai:grok-4.5:mini-swe-agent:medium')
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

  it('includes Gemini 3.7 Flash (high) at intelligence 56 with a provider', () => {
    expect(intelligence.find((entry) => entry.model === 'Gemini 3.7 Flash (high)')).toMatchObject({
      score: 56,
      provider: 'Google',
      open_weight: false,
    })
  })

  it('includes Grok 4.6 (high) at intelligence 61 with a provider', () => {
    expect(intelligence.find((entry) => entry.model === 'Grok 4.6 (high)')).toMatchObject({
      score: 61,
      provider: 'xAI',
      open_weight: false,
    })
  })

  it('includes GLM-5.3 (max) as an open-weight Z AI model at intelligence 60', () => {
    expect(intelligence.find((entry) => entry.model === 'GLM-5.3 (max)')).toMatchObject({
      score: 60,
      provider: 'Z AI',
      open_weight: true,
    })
  })

  it('includes GLM-5.3 Flash as an open-weight Z AI model at intelligence 57', () => {
    expect(intelligence.find((entry) => entry.model === 'GLM-5.3 Flash')).toMatchObject({
      score: 57,
      provider: 'Z AI',
      open_weight: true,
    })
  })

  it('includes DeepSeek V4 Pro 0813 (max) as an open-weight model at intelligence 53', () => {
    expect(intelligence.find((entry) => entry.model === 'DeepSeek V4 Pro 0813 (max)')).toMatchObject({
      score: 53,
      provider: 'DeepSeek',
      open_weight: true,
    })
  })

  it('no longer includes GLM-4.7 (dropped from the v4.1.1 leaderboard)', () => {
    expect(intelligence.find((entry) => entry.model === 'GLM-4.7')).toBeUndefined()
  })

  it('includes all news articles sorted newest first', () => {
    // The newest article (2026-08-14) should be first.
    expect(news[0]).toEqual({
      url: 'https://www.interconnects.ai/p/glm-53-how-chinese-labs-keep-stride',
      date: '2026-08-14',
    })
    // Every entry is sorted descending by date.
    for (let i = 1; i < news.length; i++) {
      expect(news[i].date <= news[i - 1].date).toBe(true)
    }
    // All expected URLs are present.
    const urls = new Set(news.map((entry) => entry.url))
    expect(urls.has('https://www.interconnects.ai/p/glm-53-how-chinese-labs-keep-stride')).toBe(true)
    expect(urls.has('https://artificialanalysis.ai/articles/gemini-3-7-time-frontier')).toBe(true)
    expect(urls.has('https://unsloth.ai/docs/models/qwen3.8')).toBe(true)
    expect(urls.has('https://www.theregister.com/systems/2026/08/06/amd-acquires-ai-chip-startup-taalas-to-boost-inference-performance-by-etching-models-into-silicon/5284344')).toBe(true)
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
    expect(news).toHaveLength(20)
  })

  it('includes hardware entries with 1-bit and 2-bit quant sizes, urls, and null for missing quants', () => {
    expect(hardware).toHaveLength(10)
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
    const glm53 = hardware.find((e) => e.model === 'GLM-5.3 (max)')
    expect(glm53).toMatchObject({
      provider: 'Z AI', total_params: '754B',
      iq1_s_gb: 217, iq1_m_gb: 228,
      iq2_xxs_gb: null, iq2_m_gb: 239,
      url: 'https://huggingface.co/unsloth/GLM-5.3-GGUF',
    })
    const glm53Flash = hardware.find((e) => e.model === 'GLM-5.3 Flash')
    expect(glm53Flash).toMatchObject({
      provider: 'Z AI', total_params: '320B',
      iq1_s_gb: 93.1, iq1_m_gb: 97.6,
      iq2_xxs_gb: null, iq2_m_gb: null,
      url: 'https://huggingface.co/unsloth/GLM-5.3-Flash-GGUF',
    })
    const qwenFlash = hardware.find((e) => e.model === 'Qwen3.8 Flash Next')
    expect(qwenFlash).toMatchObject({
      provider: 'Alibaba', total_params: '125B',
      iq1_s_gb: 72.5, iq1_m_gb: 74.5,
      iq2_xxs_gb: null, iq2_m_gb: null,
      url: 'https://huggingface.co/unsloth/Qwen3.8-Flash-Next-GGUF',
    })
    const qwen27b = hardware.find((e) => e.model === 'Qwen3.8 27B')
    expect(qwen27b).toMatchObject({
      provider: 'Alibaba', total_params: '27B',
      iq1_s_gb: 6.19, iq1_m_gb: 6.73,
      iq2_xxs_gb: 7.27, iq2_m_gb: null,
      url: 'https://huggingface.co/unsloth/Qwen3.8-27B-GGUF',
    })
  })

  it('attaches intelligence scores to hardware rows (null when the model has no AI row)', () => {
    const enriched = mergeHardwareIntelligence(hardware, intelligence)
    const byModel = new Map(enriched.map((entry) => [entry.model, entry.intelligence_score]))
    expect(byModel.get('GLM-5.3 (max)')).toBe(60)
    expect(byModel.get('GLM-5.3 Flash')).toBe(57)
    expect(byModel.get('Kimi K3')).toBe(60)
    expect(byModel.get('Inkling')).toBe(42)
    // Unique-prefix fallback: hardware's "Nemotron 3 Ultra 550B" matches
    // ai.json's "Nemotron 3 Ultra".
    expect(byModel.get('Nemotron 3 Ultra 550B')).toBe(38)
    // No ai.json rows for these yet.
    expect(byModel.get('Qwen3.8 Flash Next')).toBeNull()
    expect(byModel.get('Qwen3.8 27B')).toBeNull()
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

  it('includes local hardware machines sorted by VRAM descending, largest config per machine', () => {
    expect(machines).toHaveLength(6)
    // Data file is authored largest-first; the table defaults to VRAM desc.
    for (let i = 1; i < machines.length; i++) {
      expect(machines[i].vram_gb <= machines[i - 1].vram_gb).toBe(true)
    }
    const studioUltra = machines.find((e) => e.machine === 'Mac Studio (M5 Ultra, 2026)')
    expect(studioUltra).toMatchObject({
      chip: 'Apple M5 Ultra', vram_gb: 256, memory_bandwidth_gbs: 1200, price_usd: 9499,
    })
    const studioMax = machines.find((e) => e.machine === 'Mac Studio (M5 Max, 2026)')
    expect(studioMax).toMatchObject({
      chip: 'Apple M5 Max', vram_gb: 128, memory_bandwidth_gbs: 614, price_usd: 5099,
    })
    const dgxSpark = machines.find((e) => e.machine === 'NVIDIA DGX Spark')
    expect(dgxSpark).toMatchObject({
      chip: 'NVIDIA GB10 Grace Blackwell', vram_gb: 128, memory_bandwidth_gbs: 273, price_usd: 4699,
      url: 'https://www.nvidia.com/en-us/products/workstations/dgx-spark/',
    })
    const framework = machines.find((e) => e.machine === 'Framework Desktop')
    expect(framework).toMatchObject({
      chip: 'AMD Ryzen AI Max+ 395 (Strix Halo)', vram_gb: 128, memory_bandwidth_gbs: 256, price_usd: 1999,
      url: 'https://frame.work/desktop',
    })
    const miniM5Pro = machines.find((e) => e.machine === 'Mac mini (M5 Pro, 2026)')
    expect(miniM5Pro).toMatchObject({
      chip: 'Apple M5 Pro', vram_gb: 64, memory_bandwidth_gbs: 307, price_usd: 2699,
    })
    const miniM6 = machines.find((e) => e.machine === 'Mac mini (M6, 2026)')
    expect(miniM6).toMatchObject({
      chip: 'Apple M6', vram_gb: 32, memory_bandwidth_gbs: 170, price_usd: 1299,
    })
  })
})
