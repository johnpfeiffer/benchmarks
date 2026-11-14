import { describe, it, expect } from 'vitest'
import { withCompanyColors, decisionCompanies } from '../decision'
import type { DecisionEntry } from '../types'

/**
 * Decision rows keep their explicit decision.json brand colors; the only
 * view-level rule is that a company which is also a known Intelligence Index
 * provider reuses its ai.json color, so a vendor on both charts shows one
 * color (OpenAI is the only such company today).
 */
describe('withCompanyColors', () => {
  it('applies the known intelligence provider color to its decision rows without mutating the input', () => {
    const entries: DecisionEntry[] = [
      { model: 'GPT-6 Luna (Decisions)', provider: 'OpenAI', score: 48, color: '#000000' },
      { model: 'Clef', provider: 'Cloudflare', score: 49, color: '#f18322' },
    ]
    const colored = withCompanyColors(entries, new Map([['OpenAI', '#1f1f1f']]))
    expect(colored[0].color).toBe('#1f1f1f')
    expect(colored[1].color).toBe('#f18322')
    expect(entries[0].color).toBe('#000000')
  })

  it('leaves every row untouched when no company is a known provider', () => {
    // One company's several models share its color in the data; that passes
    // through as-is.
    const entries: DecisionEntry[] = [
      { model: 'd1-ultra', provider: 'Liquid AI', score: 65, color: '#7B3AED' },
      { model: 'd1', provider: 'Liquid AI', score: 50, color: '#7B3AED' },
      { model: 'Clef', provider: 'Cloudflare', score: 49, color: '#f18322' },
      { model: 'Clef-Omni', provider: 'Cloudflare', score: 44, color: '#f18322' },
    ]
    expect(withCompanyColors(entries, new Map())).toEqual(entries)
  })
})

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
