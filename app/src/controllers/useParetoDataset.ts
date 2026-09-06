import { useState } from 'react'
import { parseParetoDataset, type ParetoDataset } from '../models/pareto'
import rawParetoDataset from '../data/pareto.json'

/** Loads bundled data; pasted data stays in this browser session. */
export function useParetoDataset() {
  const [dataset, setDataset] = useState<ParetoDataset>(() => parseParetoDataset(rawParetoDataset))
  const [error, setError] = useState('')

  function importJson(text: string) {
    try {
      const parsed = parseParetoDataset(JSON.parse(text))
      setDataset(parsed)
      setError('')
      return true
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid JSON data.')
      return false
    }
  }

  function reload() {
    setDataset(parseParetoDataset(rawParetoDataset))
    setError('')
  }

  return { dataset, loading: false, error, importJson, reload }
}
