import { describe, expect, it } from 'vitest'
import { aaVersionsDesc, compareAAVersions, filterByAAVersion } from '../version'

describe('compareAAVersions', () => {
  it('orders numerically, not lexicographically (v4.10 > v4.3)', () => {
    expect(compareAAVersions('v4.10', 'v4.3')).toBeGreaterThan(0)
    expect(compareAAVersions('v4.3', 'v4.2')).toBeGreaterThan(0)
    expect(compareAAVersions('v4.2', 'v4.1.1')).toBeGreaterThan(0)
    expect(compareAAVersions('v4.3', 'v4.3')).toBe(0)
    expect(compareAAVersions('v4.2', 'v4.2.0')).toBe(0)
  })
})

describe('aaVersionsDesc', () => {
  it('lists distinct versions newest first', () => {
    const entries = [
      { aa_version: 'v4.2' },
      { aa_version: 'v4.3' },
      { aa_version: 'v4.2' },
      { aa_version: 'v4.1.1' },
    ]
    expect(aaVersionsDesc(entries)).toEqual(['v4.3', 'v4.2', 'v4.1.1'])
    expect(aaVersionsDesc([])).toEqual([])
  })
})

describe('filterByAAVersion', () => {
  it('keeps only the requested version without mutating the input', () => {
    const entries = [
      { aa_version: 'v4.3', score: 53 },
      { aa_version: 'v4.2', score: 57 },
    ]
    expect(filterByAAVersion(entries, 'v4.2')).toEqual([{ aa_version: 'v4.2', score: 57 }])
    expect(entries).toHaveLength(2)
  })
})
