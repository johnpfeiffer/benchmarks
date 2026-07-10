import { useMemo, useState } from 'react'
import { RouterProvider, createBrowserRouter, Outlet, useParams } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { theme } from './theme'
import {
  parseModelEntries,
  parseSweEntries,
  mergeSweMetrics,
  modelMatchKey,
  sortModels,
  nextSortState,
  DEFAULT_SORT,
  type ModelEntry,
  type SortField,
  type SortState,
} from './models'
import { Dashboard, type DataSourceCredit } from './views/Dashboard'
import rawIntelligenceData from './data/ai.json'
import rawSweData from './data/swe.json'

export type AppContext = { app: string }

/**
 * Controller: parses the embedded JSON once (upholding INV-001 at the gate),
 * owns the sort state, and feeds already-sorted data to the pure Dashboard view.
 */
function useBenchmarkState(entries: readonly ModelEntry[]) {
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(entries.map((entry) => entry.id)))

  const sorted = useMemo(() => sortModels(entries, sort), [entries, sort])
  const chartEntries = useMemo(
    () => sorted.filter((entry) => selectedIds.has(entry.id)),
    [sorted, selectedIds],
  )

  const handleSortChange = (field: SortField) => {
    setSort((current) => nextSortState(current, field))
  }

  const handleToggleEntry = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return { sorted, chartEntries, sort, selectedIds, handleSortChange, handleToggleEntry }
}

function DashboardPage() {
  // Parse + validate once. If the embedded data ever violates INV-001 this
  // throws loudly at module load rather than rendering partial state.
  const intelligenceEntries = useMemo(() => parseModelEntries(rawIntelligenceData), [])
  const sweEntries = useMemo(() => parseSweEntries(rawSweData), [])
  const tableEntries = useMemo(
    () => mergeSweMetrics(intelligenceEntries, sweEntries),
    [intelligenceEntries, sweEntries],
  )

  const table = useBenchmarkState(tableEntries)
  const deselectedModelKeys = useMemo(
    () => new Set(tableEntries.filter((entry) => !table.selectedIds.has(entry.id)).map((entry) => modelMatchKey(entry.model))),
    [tableEntries, table.selectedIds],
  )
  const selectedSweEntries = useMemo(
    () => sweEntries.filter((entry) => !deselectedModelKeys.has(modelMatchKey(entry.model))),
    [sweEntries, deselectedModelKeys],
  )
  const tastefulSweChartEntries = useMemo(() => sortModels(selectedSweEntries, DEFAULT_SORT), [selectedSweEntries])
  const basicSweChartEntries = useMemo(
    () => sortModels(
      selectedSweEntries.map((entry) => ({
        ...entry,
        id: `${entry.id}:basic`,
        score: entry.basic_solve_rate_pct ?? entry.score,
      })),
      DEFAULT_SORT,
    ),
    [selectedSweEntries],
  )

  const sources: DataSourceCredit[] = [
    { label: 'Artificial Analysis', href: 'https://artificialanalysis.ai/' },
    { label: 'Senior SWE Bench', href: 'https://senior-swe-bench.snorkel.ai/' },
  ]

  return (
    <Dashboard
      entries={table.sorted}
      intelligenceChartEntries={table.chartEntries}
      tastefulSweChartEntries={tastefulSweChartEntries}
      basicSweChartEntries={basicSweChartEntries}
      sort={table.sort}
      selectedIds={table.selectedIds}
      onSortChange={table.handleSortChange}
      onToggleEntry={table.handleToggleEntry}
      sources={sources}
    />
  )
}

function AppLayout() {
  const { app = '' } = useParams()
  return <Outlet context={{ app } satisfies AppContext} />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Outlet />,
    children: [
      {
        path: ':app',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
        ],
      },
      {
        index: true,
        element: <DashboardPage />,
      },
    ],
  },
])

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
