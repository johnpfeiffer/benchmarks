import { describe, it, expect } from 'vitest'
import { sortNewsDescending, type NewsItem } from '../news'

describe('sortNewsDescending', () => {
  it('sorts by date descending (newest first)', () => {
    const items: NewsItem[] = [
      { url: 'https://example.com/old', date: '2026-01-01' },
      { url: 'https://example.com/new', date: '2026-12-31' },
      { url: 'https://example.com/mid', date: '2026-06-15' },
    ]
    const sorted = sortNewsDescending(items)
    expect(sorted.map((item) => item.url)).toEqual([
      'https://example.com/new',
      'https://example.com/mid',
      'https://example.com/old',
    ])
  })

  it('does not mutate the input array', () => {
    const items: NewsItem[] = [
      { url: 'https://example.com/a', date: '2026-01-01' },
      { url: 'https://example.com/b', date: '2026-12-31' },
    ]
    sortNewsDescending(items)
    expect(items[0].url).toBe('https://example.com/a')
  })

  it('handles an empty array', () => {
    expect(sortNewsDescending([])).toEqual([])
  })
})
