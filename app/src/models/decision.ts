import type { DecisionEntry } from './types'

/**
 * A company (provider) behind one or more Decision Index models, with the
 * single color its chart bars and legend swatch share. Built by
 * decisionCompanies from already-colored rows (see withCompanyColors).
 */
export interface DecisionCompany {
  provider: string
  color: string
  models: readonly { model: string; score: number }[]
}

/**
 * Reassignment palette for companies whose explicit decision.json color
 * collides with another company's. Kept clear of every color in the
 * 2026-11-04 capture and of the intelligence provider palette.
 */
const FALLBACK_COMPANY_COLORS = ['#9C27B0', '#009688', '#795548', '#FF5722', '#607D8B', '#C2185B', '#7CB342', '#5C6BC0'] as const

/** Neutral swatch for a company whose rows carry no color at all. */
const UNCOLORED = '#757575'

/**
 * One chart color per Decision Index company.
 *
 * decision.json mirrors AA's per-creator colors, but AA reuses colors across
 * creators (four companies share #000000 in the 2026-11-04 capture), which
 * makes bars indistinguishable. Resolution order, first claimant wins in
 * chart order (score descending):
 *
 * 1. A company that is also a known Intelligence Index provider reuses that
 *    provider's ai.json color (knownProviderColors).
 * 2. A company keeps its explicit decision.json color when no company seen
 *    so far already shows it (compared case-insensitively).
 * 3. Otherwise the next unclaimed fallback color; past the palette the
 *    company keeps its explicit color even though duplicated — the "attempt"
 *    ceiling.
 */
export function companyColorMap(
  entries: readonly DecisionEntry[],
  knownProviderColors: ReadonlyMap<string, string>,
): ReadonlyMap<string, string> {
  const colors = new Map<string, string>()
  const claimed = new Set<string>()
  let fallbackIndex = 0
  for (const entry of entries) {
    if (colors.has(entry.provider)) continue
    const known = knownProviderColors.get(entry.provider)
    if (known) {
      colors.set(entry.provider, known)
      claimed.add(known.toLowerCase())
      continue
    }
    if (entry.color && !claimed.has(entry.color.toLowerCase())) {
      colors.set(entry.provider, entry.color)
      claimed.add(entry.color.toLowerCase())
      continue
    }
    while (
      fallbackIndex < FALLBACK_COMPANY_COLORS.length &&
      claimed.has(FALLBACK_COMPANY_COLORS[fallbackIndex].toLowerCase())
    ) {
      fallbackIndex++
    }
    const reassigned = FALLBACK_COMPANY_COLORS[fallbackIndex] ?? entry.color ?? UNCOLORED
    colors.set(entry.provider, reassigned)
    claimed.add(reassigned.toLowerCase())
    fallbackIndex++
  }
  return colors
}

/**
 * Decision rows with every company's resolved color applied, so the chart
 * bars and the Decision Models Details legend read from one source. Input
 * rows are not mutated.
 */
export function withCompanyColors(
  entries: readonly DecisionEntry[],
  knownProviderColors: ReadonlyMap<string, string>,
): DecisionEntry[] {
  const colors = companyColorMap(entries, knownProviderColors)
  return entries.map((entry) => ({ ...entry, color: colors.get(entry.provider) ?? entry.color }))
}

/**
 * The legend rows for Decision Models Details: each company in chart order
 * with the models it makes and their scores.
 */
export function decisionCompanies(entries: readonly DecisionEntry[]): DecisionCompany[] {
  const companies = new Map<string, { provider: string; color: string; models: { model: string; score: number }[] }>()
  for (const entry of entries) {
    let company = companies.get(entry.provider)
    if (!company) {
      company = { provider: entry.provider, color: entry.color ?? UNCOLORED, models: [] }
      companies.set(entry.provider, company)
    }
    company.models.push({ model: entry.model, score: entry.score })
  }
  return [...companies.values()]
}
