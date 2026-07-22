/** A hardcoded news link displayed in the News section below the lead chart. */
export interface NewsItem {
  url: string
  date: string
}

/**
 * Sort news items by date descending (newest first).
 *
 * Dates are ISO strings (e.g. "2026-07-26"), so lexicographic comparison
 * gives correct chronological ordering.
 */
export function sortNewsDescending(items: readonly NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => b.date.localeCompare(a.date))
}
