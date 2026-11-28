import { describe, expect, it } from 'vitest'
import { unusableTitle } from '../ModelTable'

describe('unusableTitle', () => {
  it('appends the per-model symptom wording when provided', () => {
    expect(unusableTitle('too verbose, uses way too many tokens = claudese')).toBe(
      'Maintainer warning (2026-11-27): unusable in practice — too verbose, uses way too many tokens = claudese',
    )
  })

  it('falls back to the generic warning when no reason is recorded', () => {
    expect(unusableTitle()).toBe(
      'Maintainer warning (2026-11-27): unusable in practice despite the benchmark score.',
    )
    expect(unusableTitle()).not.toContain('instruction drift')
    expect(unusableTitle()).not.toContain('claudese')
  })
})
