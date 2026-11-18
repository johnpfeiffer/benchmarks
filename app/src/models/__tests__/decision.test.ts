import { describe, it, expect } from 'vitest'
import { decisionCompanies } from '../decision'
import type { DecisionEntry } from '../types'

/**
 * The Decision Models Details legend groups each company with its models in
 * chart order. Colors come verbatim from decision.json — the
 * research-ai-models skill syncs them at data-entry time (a company that is
 * also an intelligence provider takes its ai.json color).
 */
describe('decisionCompanies', () => {
  it('groups each company with its models in first-appearance (chart) order', () => {
    const entries: DecisionEntry[] = [
      { model: 'd1-ultra', provider: 'Liquid AI', score: 65, color: '#7B3AED' },
      { model: 'SubQ Snap 1.1', provider: 'Subquadratic', score: 65, color: '#E04E1F' },
      { model: 'd1', provider: 'Liquid AI', score: 50, color: '#7B3AED' },
    ]
    expect(decisionCompanies(entries)).toEqual([
      { provider: 'Liquid AI', color: '#7B3AED', models: [{ model: 'd1-ultra', score: 65 }, { model: 'd1', score: 50 }] },
      { provider: 'Subquadratic', color: '#E04E1F', models: [{ model: 'SubQ Snap 1.1', score: 65 }] },
    ])
  })

  it('falls back to a neutral swatch when a row carries no color', () => {
    const companies = decisionCompanies([{ model: 'X', provider: 'Solo', score: 10 }])
    expect(companies).toHaveLength(1)
    expect(companies[0].color).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
