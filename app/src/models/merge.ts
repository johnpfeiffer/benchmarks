import type { HardwareEntry, ModelEntry } from './types'

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

/**
 * Attach each hardware row's Artificial Analysis intelligence score using the
 * same model-family normalization as the SWE merge. Falls back to a unique
 * prefix match for rows whose name carries an extra size suffix (e.g.
 * "Nemotron 3 Ultra 550B" matching ai.json's "Nemotron 3 Ultra"). Rows with
 * no match get `intelligence_score: null` so the table renders "*".
 */
export function mergeHardwareIntelligence(
  hardwareEntries: readonly HardwareEntry[],
  intelligenceEntries: readonly ModelEntry[],
): HardwareEntry[] {
  const scoreByKey = new Map(intelligenceEntries.map((entry) => [modelMatchKey(entry.model), entry.score]))

  return hardwareEntries.map((entry) => {
    const key = modelMatchKey(entry.model)
    const exact = scoreByKey.get(key)
    if (exact !== undefined) {
      return { ...entry, intelligence_score: exact }
    }
    const prefixMatches = [...scoreByKey.keys()].filter(
      (candidate) => candidate.startsWith(key) || key.startsWith(candidate),
    )
    const prefixKey = prefixMatches.length === 1 ? prefixMatches[0] : undefined
    return { ...entry, intelligence_score: prefixKey === undefined ? null : scoreByKey.get(prefixKey) ?? null }
  })
}
