export interface ParetoPoint {
  /** Include the effort variant in the name, e.g. Model (high). */
  model: string
  provider: string
  intelligence: number
  /** Total cost of running the benchmark, not price per million tokens. */
  cost_usd: number
  color?: string
}

export interface ParetoDataset {
  benchmark_version: string
  date: string
  sample: boolean
  models: ParetoPoint[]
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a JSON object.')
  return value as Record<string, unknown>
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required.`)
  return value.trim()
}

/** A single snapshot prevents silently joining scores/costs from different index versions. */
export function parseParetoDataset(value: unknown): ParetoDataset {
  const raw = record(value)
  const benchmark_version = requiredText(raw.benchmark_version, 'benchmark_version')
  const date = requiredText(raw.date, 'date')
  const timestamp = Date.parse(`${date}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) {
    throw new Error('date must be a valid YYYY-MM-DD date.')
  }
  if (typeof raw.sample !== 'boolean') throw new Error('sample must be true for example data or false for measured data.')
  if (!Array.isArray(raw.models) || raw.models.length === 0 || raw.models.length > 1000) {
    throw new Error('models must contain between 1 and 1000 points.')
  }
  const seen = new Set<string>()
  const models = raw.models.map((value, i) => {
    const row = record(value)
    const model = requiredText(row.model, `Model ${i + 1}: model`)
    // INV-001: every plotted model has a provider.
    const provider = requiredText(row.provider, `${model}: provider`)
    const { intelligence, cost_usd, color } = row
    if (typeof intelligence !== 'number' || !Number.isFinite(intelligence) || intelligence < 0 || intelligence > 100) {
      throw new Error(`${model}: intelligence must be a number from 0 to 100.`)
    }
    if (typeof cost_usd !== 'number' || !Number.isFinite(cost_usd) || cost_usd <= 0) {
      throw new Error(`${model}: cost_usd must be positive for the logarithmic axis.`)
    }
    if (color !== undefined && (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color))) {
      throw new Error(`${model}: color must be a six-digit hex color.`)
    }
    const key = `${provider.toLowerCase()}:${model.toLowerCase()}`
    if (seen.has(key)) throw new Error(`${model}: duplicate model/provider; include the effort variant in model.`)
    seen.add(key)
    return { model, provider, intelligence, cost_usd, ...(typeof color === 'string' ? { color } : {}) }
  })
  return { benchmark_version, date, sample: raw.sample, models }
}

/** Minimize cost, maximize intelligence. Identical tradeoffs remain on the frontier. */
export function paretoFrontier(points: readonly ParetoPoint[]): ParetoPoint[] {
  return points.filter(point => !points.some(other =>
    other.cost_usd <= point.cost_usd && other.intelligence >= point.intelligence &&
    (other.cost_usd < point.cost_usd || other.intelligence > point.intelligence),
  )).sort((a, b) => a.cost_usd - b.cost_usd)
}

export function meetsParetoTarget(point: ParetoPoint, maxCost: number, minIntelligence: number): boolean {
  return point.cost_usd < maxCost && point.intelligence > minIntelligence
}

/** Fixed extents for the snapshot keep the chart stable while adjusting thresholds. */
export function paretoBounds(points: readonly ParetoPoint[]) {
  const costs = points.map(p => p.cost_usd)
  const scores = points.map(p => p.intelligence)
  return {
    minCost: Math.max(Number.MIN_VALUE, Math.min(...costs) / 1.5),
    maxCost: Math.min(Number.MAX_VALUE, Math.max(...costs) * 1.5),
    minScore: Math.max(0, Math.floor((Math.min(...scores) - 5) / 5) * 5),
    maxScore: Math.min(100, Math.ceil((Math.max(...scores) + 5) / 5) * 5),
  }
}
