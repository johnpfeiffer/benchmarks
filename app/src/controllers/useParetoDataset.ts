import { useState } from 'react'
import { parseParetoDataset, type ParetoDataset } from '../models/pareto'

/**
 * The published snapshot comes from the controller, derived from the
 * selected index version's costed rows (models/pareto.paretoSnapshotFromModels;
 * the real data's per-version validity is pinned in data.test.ts). Pasted
 * data overrides it for the browser session — including across version
 * switches — until Reload restores the selected version's published
 * snapshot.
 */
export function useParetoDataset(published: ParetoDataset) {
  const [pasted, setPasted] = useState<ParetoDataset | null>(null)
  const [error, setError] = useState('')

  function importJson(text: string) {
    try {
      setPasted(parseParetoDataset(JSON.parse(text)))
      setError('')
      return true
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid JSON data.')
      return false
    }
  }

  function reload() {
    setPasted(null)
    setError('')
  }

  return { dataset: pasted ?? published, error, importJson, reload }
}
