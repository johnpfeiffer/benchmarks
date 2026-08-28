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
  /** Whether the model's weights are openly available. Optional in raw data. */
  open_weight?: boolean
  /** Explicit bar color (hex). Optional in raw data; ai.json carries one per row. */
  color?: string
}

/** A single Senior SWE Bench row, as embedded in the JSON data. */
export interface RawSweEntry {
  model: string
  harness: string
  effort: string
  tasteful_solve_rate_pct: number
  basic_solve_rate_pct: number
  avg_steps: number
  avg_tokens: string
}

/** A news link as embedded in news.json. */
export interface RawNewsEntry {
  url: string
  /** Publication date in YYYY-MM-DD format. */
  date: string
}

/** A validated news link, sorted by the parser before reaching a view. */
export interface NewsEntry {
  url: string
  date: string
}

/** A HuggingFace hardware-compatibility row as embedded in hardware.json. */
export interface RawHardwareEntry {
  model: string
  provider: string
  /** Total parameter count as a human-readable string, e.g. "264B" or "2.8T". */
  total_params: string
  /** UD-IQ1_S quant size in GB, or null when the quant is not published. */
  iq1_s_gb: number | null
  /** UD-IQ1_M quant size in GB, or null when the quant is not published. */
  iq1_m_gb: number | null
  /** UD-IQ2_XXS quant size in GB, or null when the quant is not published. */
  iq2_xxs_gb: number | null
  /** UD-IQ2_M quant size in GB, or null when the quant is not published. */
  iq2_m_gb: number | null
  /** HuggingFace model page URL. */
  url: string
}

/** A validated hardware entry. Exists only when INV-001 holds. */
export interface HardwareEntry {
  model: string
  provider: string
  total_params: string
  iq1_s_gb: number | null
  iq1_m_gb: number | null
  iq2_xxs_gb: number | null
  iq2_m_gb: number | null
  url: string
}

/** A GPU hardware-spec row as embedded in gpu.json. */
export interface RawGpuEntry {
  model: string
  /** Release date as YYYY or YYYY-MM string. */
  date: string
  /** Memory description, e.g. "80 GB HBM3e" or "40 HBM2e (80* opt)". */
  memory: string | null
  /** Memory type, e.g. "HBM3e", "GDDR6X". */
  memory_type: string | null
  /** Memory bandwidth in GB/s. */
  memory_bandwidth_gbs: number | null
  /** FP16 tensor TFLOPS. */
  fp16_tflops: number | null
}

/** A validated GPU entry. Exists only when structural guards hold. */
export interface GpuEntry {
  model: string
  date: string
  memory: string | null
  memory_type: string | null
  memory_bandwidth_gbs: number | null
  fp16_tflops: number | null
}

/** A validated model entry. Exists only when INV-001 holds. */
export interface ModelEntry {
  id: string
  model: string
  /** Primary benchmark score, the "Score" column in the dashboard. */
  score: number
  provider: string
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
