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

/**
 * The chart bar color per provider, first row with a color wins. Used by the
 * Model Details provider filter buttons, whose outlines carry the provider's
 * color as a color key for the chart bars.
 */
export function providerColorMap(entries: readonly ModelEntry[]): ReadonlyMap<string, string> {
  const map = new Map<string, string>()
  for (const entry of entries) {
    if (entry.color && !map.has(entry.provider)) map.set(entry.provider, entry.color)
  }
  return map
}
