import type { ModelEntry } from './types'

export function modelMatchKey(model: string): string {
  return model
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\bpreview\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Add optional SWE metrics to intelligence rows by model-family match.
 *
 * Missing metrics stay undefined so the view can render the required "*"
 * placeholder without weakening the chart score contract.
 */
export function mergeSweMetrics(
  intelligenceEntries: readonly ModelEntry[],
  sweEntries: readonly ModelEntry[],
): ModelEntry[] {
  const sweByModel = new Map(sweEntries.map((entry) => [modelMatchKey(entry.model), entry]))

  return intelligenceEntries.map((entry) => {
    const swe = sweByModel.get(modelMatchKey(entry.model))
    if (!swe) {
      return entry
    }

    return {
      ...entry,
      tasteful_solve_rate_pct: swe.tasteful_solve_rate_pct,
      basic_solve_rate_pct: swe.basic_solve_rate_pct,
      avg_steps: swe.avg_steps,
      avg_tokens: swe.avg_tokens,
    }
  })
}
