import type { HardwareEntry, ModelEntry, ProgressEntry } from './types'

export function modelMatchKey(model: string): string {
  return model
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\bpreview\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Parameter-size / active-parameter tokens, e.g. "550B", "2.4T", "A55B". */
const SIZE_TOKEN = /^(\d+(\.\d+)?[btm]|a\d+b)$/i

/** True when `longer` extends `shorter` only by parameter-size tokens. */
function sizeOnlyRemainder(longer: string, shorter: string): boolean {
  const remainder = longer.slice(shorter.length).trim()
  return remainder !== '' && remainder.split(/\s+/).every((token) => SIZE_TOKEN.test(token))
}

/**
 * Look up a model-family value by normalized key. Exact matches win; the only
 * fallback is a unique match differing solely by parameter-size suffixes
 * (e.g. "Nemotron 3 Ultra 550B" matching ai.json's "Nemotron 3 Ultra").
 * Version or variant differences ("Kimi K3" vs "Kimi K3.1 Pro", "GLM-5.3
 * Flash" vs "GLM-5.3") are different models and must not inherit each
 * other's values, so they yield null.
 */
function lookupByMatchKey(valueByKey: ReadonlyMap<string, number>, key: string): number | null {
  const exact = valueByKey.get(key)
  if (exact !== undefined) return exact
  const matches = [...valueByKey.keys()].filter(
    (candidate) =>
      (candidate.startsWith(key) && sizeOnlyRemainder(candidate, key)) ||
      (key.startsWith(candidate) && sizeOnlyRemainder(key, candidate)),
  )
  return matches.length === 1 ? valueByKey.get(matches[0]) ?? null : null
}

/**
 * Attach each hardware row's Artificial Analysis intelligence score using
 * model-family normalization (parenthetical effort suffixes stripped).
 * Rows with no match get `intelligence_score: null` so the table renders "*".
 */
export function mergeHardwareIntelligence(
  hardwareEntries: readonly HardwareEntry[],
  intelligenceEntries: readonly ModelEntry[],
): HardwareEntry[] {
  const scoreByKey = new Map(intelligenceEntries.map((entry) => [modelMatchKey(entry.model), entry.score]))

  return hardwareEntries.map((entry) => ({
    ...entry,
    intelligence_score: lookupByMatchKey(scoreByKey, modelMatchKey(entry.model)),
  }))
}

/**
 * Attach each hardware row's AA Progress Index value using the same
 * model-family normalization. Progress is AA's IRT-linked cross-version
 * scale — a different metric from intelligence_score, never merged into it.
 * Rows with no published Progress value get `progress: null`.
 */
export function mergeHardwareProgress(
  hardwareEntries: readonly HardwareEntry[],
  progressEntries: readonly ProgressEntry[],
): HardwareEntry[] {
  const progressByKey = new Map(progressEntries.map((entry) => [modelMatchKey(entry.model), entry.progress]))

  return hardwareEntries.map((entry) => ({
    ...entry,
    progress: lookupByMatchKey(progressByKey, modelMatchKey(entry.model)),
  }))
}
