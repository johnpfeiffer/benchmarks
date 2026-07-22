import { describe, expect, it } from 'vitest'
import { InvariantError, parseNewsEntries } from '../parse'
import type { RawNewsEntry } from '../types'

describe('parseNewsEntries', () => {
  it('sorts valid articles newest first without mutating the input', () => {
    const raw: RawNewsEntry[] = [
      { url: 'https://example.com/oldest', date: '2026-06-01' },
      { url: 'https://example.com/newest', date: '2026-07-26' },
      { url: 'https://example.com/middle', date: '2026-07-20' },
    ]

    const parsed = parseNewsEntries(raw)

    expect(parsed.map((entry) => entry.url)).toEqual([
      'https://example.com/newest',
      'https://example.com/middle',
      'https://example.com/oldest',
    ])
    expect(raw[0].url).toBe('https://example.com/oldest')
  })

  it.each([
    { name: 'invalid URL', entry: { url: 'not-a-url', date: '2026-07-26' } },
    { name: 'invalid date', entry: { url: 'https://example.com/article', date: '07/26/2026' } },
  ])('rejects $name', ({ entry }) => {
    expect(() => parseNewsEntries([entry])).toThrow(InvariantError)
  })
})
