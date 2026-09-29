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

/**
 * The selection produced by the preset filters: the union of the chosen
 * providers' models (every entry when no provider is chosen), intersected
 * with the open-weight models when that preset is on. The provider buttons
 * are additive/subtractive toggles; Open Weights narrows the result.
 */
export function presetSelectionIds(
  entries: readonly ModelEntry[],
  providers: ReadonlySet<string>,
  openWeightsOnly: boolean,
): Set<string> {
  return new Set(
    entries
      .filter((entry) => (providers.size === 0 || providers.has(entry.provider)) && (!openWeightsOnly || entry.open_weight))
      .map((entry) => entry.id),
  )
}
