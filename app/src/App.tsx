import { useMemo, useState } from 'react'
import { RouterProvider, createBrowserRouter, Outlet, useParams } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { theme } from './theme'
import {
  parseModelEntries,
  sortModels,
  nextSortState,
  DEFAULT_SORT,
  type SortField,
  type SortState,
} from './models'
import { Dashboard } from './views/Dashboard'
import rawData from './data/ai.json'

export type AppContext = { app: string }

/**
 * Controller: parses the embedded JSON once (upholding INV-001 at the gate),
 * owns the sort state, and feeds already-sorted data to the pure Dashboard view.
 */
function DashboardPage() {
  // Parse + validate once. If the embedded data ever violates INV-001 this
  // throws loudly at module load rather than rendering partial state.
  const entries = useMemo(() => parseModelEntries(rawData), [])

  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)

  const sorted = useMemo(() => sortModels(entries, sort), [entries, sort])

  const handleSortChange = (field: SortField) => {
    setSort((current) => nextSortState(current, field))
  }

  return <Dashboard entries={sorted} sort={sort} onSortChange={handleSortChange} />
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
