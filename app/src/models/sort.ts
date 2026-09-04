import type { ModelEntry, SortDirection, SortField, SortState } from './types'

/** Default sort for the dashboard: score, descending (highest on the left). */
export const DEFAULT_SORT: SortState = { field: 'score', direction: 'desc' }

function tokenCount(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }
  const match = value.match(/^([\d.]+)\s*([KMB])?$/i)
  if (!match) {
    return undefined
  }
  const amount = Number(match[1])
  const suffix = match[2]?.toUpperCase()
  if (Number.isNaN(amount)) {
    return undefined
  }
  if (suffix === 'M') return amount * 1_000_000
  if (suffix === 'K') return amount * 1_000
  if (suffix === 'B') return amount * 1_000_000_000
  return amount
}

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
    case 'tasteful_solve_rate_pct':
      return entry.tasteful_solve_rate_pct
    case 'basic_solve_rate_pct':
      return entry.basic_solve_rate_pct
    case 'avg_steps':
      return entry.avg_steps
    case 'avg_tokens':
      return tokenCount(entry.avg_tokens)
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
