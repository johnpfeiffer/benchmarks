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
 * Attach each hardware row's Artificial Analysis intelligence score using
 * model-family normalization (parenthetical effort suffixes stripped).
 * Falls back to a unique prefix match for rows whose name carries an extra
 * size suffix (e.g. "Nemotron 3 Ultra 550B" matching ai.json's
 * "Nemotron 3 Ultra"). Rows with no match get `intelligence_score: null`
 * so the table renders "*".
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
