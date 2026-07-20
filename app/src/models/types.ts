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
  /** Whether the model's weights are openly available. Optional in raw data. */
  open_weight?: boolean
  /** Explicit bar color (hex). Optional in raw data; ai.json carries one per row. */
  color?: string
}

/** A single Senior SWE Bench row, as embedded in the JSON data. */
export interface RawSweEntry {
  rank: number
  model: string
  harness: string
  effort: string
  tasteful_solve_rate_pct: number
  basic_solve_rate_pct: number
  avg_steps: number
  avg_tokens: string
}

/** A validated model entry. Exists only when INV-001 holds. */
export interface ModelEntry {
  id: string
  model: string
  /** Primary benchmark score, the "Score" column in the dashboard. */
  score: number
  provider: string
  reasoning?: boolean
  /** Whether the model's weights are openly available. Always present after parse. */
  open_weight: boolean
  /** Explicit bar color (hex). Set from ai.json; absent for SWE-only entries. */
  color?: string
  tasteful_solve_rate_pct?: number
  basic_solve_rate_pct?: number
  avg_steps?: number
  avg_tokens?: string
}

/** Columns the dashboard table can sort by. */
export type SortField =
  | 'provider'
  | 'model'
  | 'score'
  | 'tasteful_solve_rate_pct'
  | 'basic_solve_rate_pct'
  | 'avg_steps'
  | 'avg_tokens'

/** Sort direction. */
export type SortDirection = 'asc' | 'desc'

/** A sort request: which field, which way. */
export interface SortState {
  field: SortField
  direction: SortDirection
}
