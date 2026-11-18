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
 * The legend rows for Decision Models Details: each company in chart order
 * with the models it makes and their scores. Colors come verbatim from
 * decision.json — the research-ai-models skill keeps them synced at
 * data-entry time (a company that is also an intelligence provider takes
 * its ai.json color), so no runtime color logic is needed.
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
