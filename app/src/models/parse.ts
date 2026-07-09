import type { ModelEntry, RawModelEntry } from './types'

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
function normalize(raw: RawModelEntry, index: number): ModelEntry {
  const provider = raw?.provider
  if (typeof provider !== 'string' || provider.trim() === '') {
    throw new InvariantError(
      `INV-001 violated at index ${index}: model "${raw?.model ?? '?'}" has no provider`,
      index,
      'INV-001',
    )
  }
  if (typeof raw?.model !== 'string' || raw.model.trim() === '') {
    throw new InvariantError(
      `Entry at index ${index} has no model name`,
      index,
      'MODEL-NAME',
    )
  }
  if (typeof raw?.intelligence_score !== 'number' || Number.isNaN(raw.intelligence_score)) {
    throw new InvariantError(
      `Entry at index ${index} ("${raw.model}") has a non-numeric intelligence_score`,
      index,
      'SCORE-NUMBER',
    )
  }

  return {
    model: raw.model,
    score: raw.intelligence_score,
    provider,
    reasoning: Boolean(raw.reasoning),
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
