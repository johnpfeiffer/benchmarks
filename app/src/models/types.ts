/**
 * Domain types for AI model benchmark data.
 *
 * The kernel invariant INV-001 ("Every model has a provider") is enforced at
 * parse time (see parse.ts), so any `ModelEntry` that exists in the system is
 * guaranteed to carry a non-empty provider.
 */

/** A single AI model benchmark row, as embedded in the JSON data. */
export interface RawModelEntry {
  model: string
  intelligence_score: number
  provider: string
  reasoning: boolean
}

/** A validated model entry. Exists only when INV-001 holds. */
export interface ModelEntry {
  model: string
  /** Intelligence score, the "Score" column in the dashboard. */
  score: number
  provider: string
  reasoning: boolean
}

/** Columns the dashboard table can sort by. */
export type SortField = 'provider' | 'model' | 'score'

/** Sort direction. */
export type SortDirection = 'asc' | 'desc'

/** A sort request: which field, which way. */
export interface SortState {
  field: SortField
  direction: SortDirection
}
