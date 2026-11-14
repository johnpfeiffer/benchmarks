import { describe, it, expect } from 'vitest'
import { companyColorMap, withCompanyColors, decisionCompanies } from '../decision'
import type { DecisionEntry } from '../types'

/**
 * decision.json mirrors AA's per-creator colors, but several companies share
 * one color (four use #000000 in the 2026-11-04 capture), which makes chart
 * bars indistinguishable. companyColorMap resolves one color per company: a
 * known intelligence-ledger provider reuses its ai.json color, the first
 * claimant of a duplicated explicit color keeps it, and the rest are
 * reassigned distinct colors on a best-effort basis.
 */
describe('companyColorMap', () => {
  it('reuses the known provider color from the intelligence ledger', () => {
    const entries: DecisionEntry[] = [{ model: 'GPT-6 Luna (Decisions)', provider: 'OpenAI', score: 48, color: '#000000' }]
    const map = companyColorMap(entries, new Map([['OpenAI', '#1f1f1f']]))
    expect(map.get('OpenAI')).toBe('#1f1f1f')
  })

  it('keeps explicit colors that no other company claimed', () => {
    const entries: DecisionEntry[] = [
      { model: 'Elephant 9B', provider: 'Baseten', score: 65, color: '#17D766' },
      { model: 'Clef', provider: 'Cloudflare', score: 49, color: '#f18322' },
    ]
    const map = companyColorMap(entries, new Map())
    expect(map.get('Baseten')).toBe('#17D766')
    expect(map.get('Cloudflare')).toBe('#f18322')
  })

  it('keeps the first claimant of a duplicated color and reassigns the rest to distinct colors', () => {
    // Mirrors decision.json's four #000000 companies.
    const entries: DecisionEntry[] = [
      { model: 'd1-ultra', provider: 'Liquid AI', score: 65, color: '#000000' },
      { model: 'SubQ Snap 1.1', provider: 'Subquadratic', score: 65, color: '#000000' },
      { model: 'Drex Max', provider: 'Nace.AI', score: 64, color: '#000000' },
      { model: 'GLiDE', provider: 'Fastino', score: 54, color: '#000000' },
    ]
    const map = companyColorMap(entries, new Map())
    expect(map.get('Liquid AI')).toBe('#000000')
    const colors = ['Liquid AI', 'Subquadratic', 'Nace.AI', 'Fastino'].map((provider) => map.get(provider))
    expect(new Set(colors).size).toBe(4)
    for (const color of colors) expect(color).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('never reassigns to a color another company already shows', () => {
    const entries: DecisionEntry[] = [
      { model: 'A', provider: 'Purple Co', score: 60, color: '#9C27B0' },
      { model: 'B', provider: 'Black One', score: 59, color: '#000000' },
      { model: 'C', provider: 'Black Two', score: 58, color: '#000000' },
    ]
    const map = companyColorMap(entries, new Map())
    expect(map.get('Black Two')).not.toBe('#9C27B0')
    expect(map.get('Black Two')).not.toBe('#000000')
  })

  it('detects duplicate colors case-insensitively', () => {
    const entries: DecisionEntry[] = [
      { model: 'A', provider: 'Upper', score: 60, color: '#F18322' },
      { model: 'B', provider: 'Lower', score: 59, color: '#f18322' },
    ]
    const map = companyColorMap(entries, new Map())
    expect(map.get('Upper')).toBe('#F18322')
    expect(map.get('Lower')?.toLowerCase()).not.toBe('#f18322')
  })
})

describe('withCompanyColors', () => {
  it('recolors every row to its company color without mutating the input', () => {
    const entries: DecisionEntry[] = [
      { model: 'd1-ultra', provider: 'Liquid AI', score: 65, color: '#000000' },
      { model: 'SubQ Snap 1.1', provider: 'Subquadratic', score: 65, color: '#000000' },
      { model: 'd1', provider: 'Liquid AI', score: 50, color: '#000000' },
    ]
    const colored = withCompanyColors(entries, new Map())
    expect(colored[0].color).toBe('#000000')
    expect(colored[1].color).not.toBe('#000000')
    expect(colored[2].color).toBe('#000000')
    expect(colored[1]).toMatchObject({ model: 'SubQ Snap 1.1', provider: 'Subquadratic', score: 65 })
    expect(entries[1].color).toBe('#000000')
  })
})

describe('decisionCompanies', () => {
  it('groups each company with its models in first-appearance (chart) order', () => {
    const entries: DecisionEntry[] = [
      { model: 'd1-ultra', provider: 'Liquid AI', score: 65, color: '#000000' },
      { model: 'SubQ Snap 1.1', provider: 'Subquadratic', score: 65, color: '#9C27B0' },
      { model: 'd1', provider: 'Liquid AI', score: 50, color: '#000000' },
    ]
    expect(decisionCompanies(entries)).toEqual([
      { provider: 'Liquid AI', color: '#000000', models: [{ model: 'd1-ultra', score: 65 }, { model: 'd1', score: 50 }] },
      { provider: 'Subquadratic', color: '#9C27B0', models: [{ model: 'SubQ Snap 1.1', score: 65 }] },
    ])
  })

  it('falls back to a neutral swatch when a row carries no color', () => {
    const companies = decisionCompanies([{ model: 'X', provider: 'Solo', score: 10 }])
    expect(companies).toHaveLength(1)
    expect(companies[0].color).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
