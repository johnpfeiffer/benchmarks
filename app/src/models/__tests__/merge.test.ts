import { describe, expect, it } from 'vitest'
import { mergeHardwareIntelligence, mergeHardwareProgress, modelMatchKey } from '../merge'
import type { HardwareEntry, ModelEntry } from '../types'

describe('modelMatchKey', () => {
  it('matches model names after parenthetical suffixes are removed', () => {
    expect(modelMatchKey('GPT-5.6 Sol (max)')).toBe('gpt-5.6 sol')
    expect(modelMatchKey('Gemini 3.1 Pro Preview')).toBe('gemini 3.1 pro')
  })
})

describe('mergeHardwareIntelligence', () => {
  const ai: ModelEntry[] = [
    { id: 'openai:gpt-5.6-sol-max', model: 'GPT-5.6 Sol (max)', score: 59, aa_version: 'v9.9', provider: 'OpenAI', open_weight: false, released: null },
    { id: 'openai:gpt-5.6-terra-max', model: 'GPT-5.6 Terra (max)', score: 56, aa_version: 'v9.9', provider: 'OpenAI', open_weight: false, released: null },
    { id: 'minimax:minimax-m3', model: 'MiniMax-M3', score: 44, aa_version: 'v9.9', provider: 'MiniMax', open_weight: true, released: null },
  ]
  const hardwareRow = (model: string): HardwareEntry => ({
    model,
    provider: 'X',
    total_params: '1B',
    iq1_m_gb: null,
    q2_k_xl_gb: null,
    q4_k_xl_gb: null,
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
describe('version and variant suffixes never inherit scores', () => {
  const ai: ModelEntry[] = [
    { id: 'moonshot:kimi-k3-1-pro', model: 'Kimi K3.1 Pro', score: 46, aa_version: 'v9.9', provider: 'Moonshot AI', open_weight: true, released: null },
    { id: 'zai:glm-5-3-max', model: 'GLM-5.3 (max)', score: 32, aa_version: 'v9.9', provider: 'Z AI', open_weight: true, released: null },
  ]
  const row = (model: string): HardwareEntry => ({
    model,
    provider: 'X',
    total_params: '1B',
    iq1_m_gb: null,
    q2_k_xl_gb: null,
    q4_k_xl_gb: null,
    url: 'https://huggingface.co/unsloth/x',
  })

  it('Kimi K3 and Kimi K3.1 stay unscored when only Kimi K3.1 Pro is measured', () => {
    const merged = mergeHardwareIntelligence([row('Kimi K3'), row('Kimi K3.1'), row('Kimi K3.1 Pro')], ai)
    expect(merged[0].intelligence_score).toBeNull()
    expect(merged[1].intelligence_score).toBeNull()
    expect(merged[2].intelligence_score).toBe(46)
  })

  it('GLM-5.3 Flash does not inherit GLM-5.3 (max)\'s score', () => {
    const merged = mergeHardwareIntelligence([row('GLM-5.3 Flash'), row('GLM-5.3 (max)')], ai)
    expect(merged[0].intelligence_score).toBeNull()
    expect(merged[1].intelligence_score).toBe(32)
  })
})

describe('mergeHardwareProgress', () => {
  const progressEntries = [
    { model: 'GLM-5.3', provider: 'Z AI', progress: 322.7 },
    { model: 'Nemotron 3 Ultra', provider: 'NVIDIA', progress: 270.6 },
  ]
  const row = (model: string): HardwareEntry => ({
    model,
    provider: 'X',
    total_params: '1B',
    iq1_m_gb: null,
    q2_k_xl_gb: null,
    q4_k_xl_gb: null,
    url: 'https://huggingface.co/unsloth/x',
  })

  it('attaches Progress values after stripping effort suffixes', () => {
    const merged = mergeHardwareProgress([row('GLM-5.3 (max)')], progressEntries)
    expect(merged[0].progress).toBe(322.7)
  })

  it('attaches Progress values across parameter-size suffixes', () => {
    const merged = mergeHardwareProgress([row('Nemotron 3 Ultra 550B')], progressEntries)
    expect(merged[0].progress).toBe(270.6)
  })

  it('leaves models without a published Progress value null', () => {
    const merged = mergeHardwareProgress([row('Inkling 2 Mini')], progressEntries)
    expect(merged[0].progress).toBeNull()
  })
})
