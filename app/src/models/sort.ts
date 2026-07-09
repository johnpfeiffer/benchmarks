import type { ModelEntry, SortDirection, SortField, SortState } from './types'

/** Default sort for the dashboard: score, descending (highest on the left). */
export const DEFAULT_SORT: SortState = { field: 'score', direction: 'desc' }

/**
 * Comparison helpers per field. Provider and model use locale-aware string
 * comparison; score uses numeric comparison.
 */
function compareBy(field: SortField, a: ModelEntry, b: ModelEntry): number {
  switch (field) {
    case 'provider':
      return a.provider.localeCompare(b.provider)
    case 'model':
      return a.model.localeCompare(b.model)
    case 'score':
      return a.score - b.score
  }
}

/**
 * Sort a copy of the entries by the given field and direction.
 *
 * Stable: equal-keyed entries keep their input order (Array.prototype.sort is
 * stable in modern engines). Does not mutate the input.
 */
export function sortModels(
  entries: readonly ModelEntry[],
  sort: SortState,
): ModelEntry[] {
  const sorted = [...entries]
  const sign = sort.direction === 'asc' ? 1 : -1
  sorted.sort((a, b) => compareBy(sort.field, a, b) * sign)
  return sorted
}

/** Toggle a sort direction, or switch to a new field (starting ascending). */
export function nextSortState(current: SortState, field: SortField): SortState {
  if (current.field === field) {
    const direction: SortDirection = current.direction === 'asc' ? 'desc' : 'asc'
    return { field, direction }
  }
  return { field, direction: 'asc' }
}
