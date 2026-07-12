import type { ModelEntry, RawModelEntry, RawSweEntry } from './types'

/**
 * Error raised when raw data violates a kernel invariant.
 *
 * Carries the offending index so callers can locate the bad row without
 * weakening the invariant (see /KERNEL/AGENTS.md: never delete or weaken
 * validation criteria without recording the reason).
 */
export class InvariantError extends Error {
  readonly index: number
  readonly invariant: string

  constructor(message: string, index: number, invariant: string) {
    super(message)
    this.name = 'InvariantError'
    this.index = index
    this.invariant = invariant
  }
}

/**
 * Validate and normalize a single raw entry.
 *
 * INV-001: Every model has a provider.
 * Also guards the other required fields so the view layer can stay dumb.
 */
function makeId(...parts: string[]): string {
  return parts.map((part) => part.trim().toLowerCase().replace(/\s+/g, '-')).join(':')
}

function assertModelName(model: unknown, index: number): string {
  if (typeof model !== 'string' || model.trim() === '') {
    throw new InvariantError(
      `Entry at index ${index} has no model name`,
      index,
      'MODEL-NAME',
    )
  }
  return model
}

function assertScore(score: unknown, index: number, model: string, field: string): number {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    throw new InvariantError(
      `Entry at index ${index} ("${model}") has a non-numeric ${field}`,
      index,
      'SCORE-NUMBER',
    )
  }
  return score
}

function normalize(raw: RawModelEntry, index: number): ModelEntry {
  const provider = raw?.provider
  if (typeof provider !== 'string' || provider.trim() === '') {
    throw new InvariantError(
      `INV-001 violated at index ${index}: model "${raw?.model ?? '?'}" has no provider`,
      index,
      'INV-001',
    )
  }
  const model = assertModelName(raw?.model, index)
  const score = assertScore(raw?.intelligence_score, index, model, 'intelligence_score')

  return {
    id: makeId(provider, model),
    model,
    score,
    provider,
    reasoning: Boolean(raw.reasoning),
    open_weight: Boolean(raw.open_weight),
  }
}

const SWE_PROVIDER_RULES: Array<{ pattern: RegExp; provider: string }> = [
  { pattern: /^claude\b/i, provider: 'Anthropic' },
  { pattern: /^gpt\b/i, provider: 'OpenAI' },
  { pattern: /^grok\b/i, provider: 'xAI' },
  { pattern: /^glm\b/i, provider: 'Z AI' },
  { pattern: /^kimi\b/i, provider: 'Moonshot AI' },
  { pattern: /^gemini\b/i, provider: 'Google' },
]

export function inferProviderFromModel(model: string): string | null {
  return SWE_PROVIDER_RULES.find((rule) => rule.pattern.test(model))?.provider ?? null
}

/**
 * Model families whose weights are openly available. Used to infer
 * `open_weight` for sources (e.g. swe.json) that do not carry the field.
 * Matches the curated open-weight set in ai.json.
 */
const OPEN_WEIGHT_PREFIXES = [
  'kimi',
  'minimax',
  'deepseek',
  'nemotron',
  'qwen',
  'glm',
  'mistral',
  'gemma',
  'gpt-oss',
]

export function isOpenWeightModel(model: string): boolean {
  const lower = model.trim().toLowerCase()
  return OPEN_WEIGHT_PREFIXES.some((prefix) => lower.startsWith(prefix))
}

function normalizeSwe(raw: RawSweEntry, index: number): ModelEntry {
  const model = assertModelName(raw?.model, index)
  const provider = inferProviderFromModel(model)
  if (!provider) {
    throw new InvariantError(
      `INV-001 violated at index ${index}: model "${model}" has no provider`,
      index,
      'INV-001',
    )
  }
  const score = assertScore(raw?.tasteful_solve_rate_pct, index, model, 'tasteful_solve_rate_pct')

  return {
    id: makeId(provider, model, raw?.harness ?? '', raw?.effort ?? ''),
    model,
    score,
    provider,
    open_weight: isOpenWeightModel(model),
    tasteful_solve_rate_pct: score,
    basic_solve_rate_pct: assertScore(raw?.basic_solve_rate_pct, index, model, 'basic_solve_rate_pct'),
    avg_steps: assertScore(raw?.avg_steps, index, model, 'avg_steps'),
    avg_tokens: raw?.avg_tokens,
  }
}

/**
 * Parse embedded JSON into validated `ModelEntry[]`.
 *
 * Throws `InvariantError` on the first row that violates INV-001 or the
 * structural guards. This is the single gate that upholds the kernel invariant
 * for the rest of the system.
 */
export function parseModelEntries(raw: readonly RawModelEntry[]): ModelEntry[] {
  if (!Array.isArray(raw)) {
    throw new InvariantError('Expected an array of model entries', -1, 'SHAPE')
  }
  return raw.map((entry, index) => normalize(entry, index))
}

/**
 * Parse Senior SWE Bench rows into the shared benchmark entry shape.
 *
 * The source omits provider, so provider is derived from known model-family
 * prefixes at the same validation gate. Unknown families are rejected as
 * INV-001 violations rather than rendered without a provider.
 */
export function parseSweEntries(raw: readonly RawSweEntry[]): ModelEntry[] {
  if (!Array.isArray(raw)) {
    throw new InvariantError('Expected an array of SWE benchmark entries', -1, 'SHAPE')
  }
  return raw.map((entry, index) => normalizeSwe(entry, index))
}
