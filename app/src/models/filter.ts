import type { ModelEntry } from './types'

/**
 * The set of entry ids whose weights are openly available.
 *
 * Used by the "Open Weights Only" preset to set the dashboard selection to
 * exactly the open-weight models.
 */
export function openWeightIds(entries: readonly ModelEntry[]): Set<string> {
  return new Set(entries.filter((entry) => entry.open_weight).map((entry) => entry.id))
}
