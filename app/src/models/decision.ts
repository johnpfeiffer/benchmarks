import type { DecisionEntry } from './types'

/**
 * A company (provider) behind one or more Decision Index models, with the
 * color its chart bars and legend swatch share. Built by decisionCompanies.
 */
export interface DecisionCompany {
  provider: string
  color: string
  models: readonly { model: string; score: number }[]
}

/** Neutral legend swatch for a company whose rows carry no color at all. */
const UNCOLORED = '#757575'

/**
 * Decision rows with Intelligence Index provider colors applied: a company
 * that is also a known intelligence provider reuses its ai.json color, so a
 * vendor on both charts shows one color. Every other row keeps its explicit
 * decision.json color untouched. Input rows are not mutated.
 */
export function withCompanyColors(
  entries: readonly DecisionEntry[],
  knownProviderColors: ReadonlyMap<string, string>,
): DecisionEntry[] {
  return entries.map((entry) => {
    const known = knownProviderColors.get(entry.provider)
    return known ? { ...entry, color: known } : entry
  })
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
