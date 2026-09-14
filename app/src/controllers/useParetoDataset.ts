import { useState } from 'react'
import { parseModelEntries } from '../models/parse'
import { parseParetoDataset, paretoSnapshotFromModels, type ParetoDataset } from '../models/pareto'
import rawModels from '../data/ai.json'

/**
 * The published snapshot derives from ai.json rows carrying a measured
 * benchmark run cost (see models/pareto.paretoSnapshotFromModels). Running it
 * through parseParetoDataset holds it to the same contract as pasted data.
 */
function defaultDataset(): ParetoDataset {
  return parseParetoDataset(paretoSnapshotFromModels(parseModelEntries(rawModels)))
}

/** Loads the ai.json-derived snapshot; pasted data stays in this browser session. */
export function useParetoDataset() {
  const [dataset, setDataset] = useState<ParetoDataset>(defaultDataset)
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
    setDataset(defaultDataset())
    setError('')
  }

  return { dataset, loading: false, error, importJson, reload }
}
