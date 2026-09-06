import type { ModelEntry, SortDirection, SortField, SortState } from './types'

/** Default sort for the dashboard: score, descending (highest on the left). */
export const DEFAULT_SORT: SortState = { field: 'score', direction: 'desc' }

function fieldValue(entry: ModelEntry, field: SortField): string | number | undefined {
  switch (field) {
    case 'provider':
      return entry.provider
    case 'released':
      // ISO dates compare chronologically as plain strings; null (unknown
      // date) is treated as missing and sorts after populated values.
      return entry.released ?? undefined
    case 'model':
      return entry.model
    case 'score':
      return entry.score
  }
}

/**
 * Comparison helpers per field. String values use locale-aware comparison;
 * numeric values use numeric comparison. Missing optional metric values sort
 * after populated values for both directions so "*" rows stay out of the way.
 */
function compareBy(field: SortField, direction: SortDirection, a: ModelEntry, b: ModelEntry): number {
  const aValue = fieldValue(a, field)
  const bValue = fieldValue(b, field)
  const aMissing = aValue === undefined
  const bMissing = bValue === undefined

  if (aMissing && bMissing) return 0
  if (aMissing) return 1
  if (bMissing) return -1

  const sign = direction === 'asc' ? 1 : -1
  const comparison = typeof aValue === 'number' && typeof bValue === 'number'
    ? aValue - bValue
    : String(aValue).localeCompare(String(bValue))
  return comparison * sign
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
  sorted.sort((a, b) => compareBy(sort.field, sort.direction, a, b))
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
