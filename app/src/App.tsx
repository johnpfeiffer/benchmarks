import { useMemo, useState } from 'react'
import { RouterProvider, createBrowserRouter, Outlet, useParams } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { theme } from './theme'
import {
  parseModelEntries,
  parseNewsEntries,
  parseHardwareEntries,
  parseGpuEntries,
  parseMachineEntries,
  mergeHardwareIntelligence,
  sortModels,
  nextSortState,
  openWeightIds,
  aaVersionsDesc,
  filterByAAVersion,
  DEFAULT_SORT,
  type ModelEntry,
  type SortField,
  type SortState,
} from './models'
import { Dashboard, type DataSourceCredit } from './views/Dashboard'
import rawIntelligenceData from './data/ai.json'
// Historical snapshots: the 2026-02-19 backfill of Intelligence Index v4.0.2
// rows and the 2025-12-30 backfill of v3.0 rows, each kept in its own file so
// ai.json stays the curated current ledger.
import rawHistoricalV402Data from './data/ai-2026-02-19.json'
import rawHistoricalV30Data from './data/ai-2025-12-30.json'
import rawNewsData from './data/news.json'
import rawHardwareData from './data/hardware.json'
import rawGpuData from './data/gpu.json'
import rawMachineData from './data/machines.json'

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

  /** Replace the entire selection (used by the "Open Weights Only" preset). */
  const replaceSelection = (ids: ReadonlySet<string>) => {
    setSelectedIds(new Set(ids))
  }

  return { sorted, chartEntries, sort, selectedIds, handleSortChange, handleToggleEntry, replaceSelection }
}

function DashboardPage() {
  // Parse + validate once. If the embedded data ever violates INV-001 this
  // throws loudly at module load rather than rendering partial state.
  // The v4.0.2 and v3.0 backfills augment ai.json: one row per model per
  // version, so the version toggle can show the 2026-02-19 and 2025-12-30
  // snapshots alongside the current ones.
  const allIntelligence = useMemo(
    () => parseModelEntries([...rawIntelligenceData, ...rawHistoricalV402Data, ...rawHistoricalV30Data]),
    [],
  )
  // ai.json keeps one row per model per Intelligence Index version; the
  // chart and table show one version at a time (newest first by default).
  const aaVersions = useMemo(() => aaVersionsDesc(allIntelligence), [allIntelligence])
  const [aaVersion, setAaVersion] = useState(aaVersions[0])
  const intelligenceEntries = useMemo(
    () => filterByAAVersion(allIntelligence, aaVersion),
    [allIntelligence, aaVersion],
  )
  const news = useMemo(() => parseNewsEntries(rawNewsData), [])
  // Hardware rows carry a single score per model: always the newest version's.
  const latestIntelligence = useMemo(
    () => filterByAAVersion(allIntelligence, aaVersions[0]),
    [allIntelligence, aaVersions],
  )
  const hardware = useMemo(
    () => mergeHardwareIntelligence(parseHardwareEntries(rawHardwareData), latestIntelligence),
    [latestIntelligence],
  )
  const gpu = useMemo(() => parseGpuEntries(rawGpuData), [])
  const machines = useMemo(() => parseMachineEntries(rawMachineData), [])

  // Entry ids are versionless (provider:model). A version switch resets the
  // selection to exactly the shown version's models (see handleAAVersionChange):
  // carrying a selection across snapshots with different model sets produced
  // charts showing only a stray shared model.
  const table = useBenchmarkState(intelligenceEntries)
  const [openWeightsOnly, setOpenWeightsOnly] = useState(false)

  // "Open Weights Only" is a selection preset: turning it on sets the selection
  // to exactly the open-weight models; turning it off re-selects every model.
  // Because the table grays deselected rows and every chart renders only the
  // selected models, the preset is reflected in the table and the charts.
  const allIds = useMemo(() => new Set(intelligenceEntries.map((entry) => entry.id)), [intelligenceEntries])
  const openIds = useMemo(() => openWeightIds(intelligenceEntries), [intelligenceEntries])

  const handleToggleOpenWeights = () => {
    if (openWeightsOnly) {
      table.replaceSelection(allIds)
      setOpenWeightsOnly(false)
    } else {
      table.replaceSelection(openIds)
      setOpenWeightsOnly(true)
    }
  }

  // A version switch resets the selection to the shown version's full model
  // set and clears the Open Weights preset, so the table and chart always
  // reflect the chosen snapshot with no leftover state from another version.
  const handleAAVersionChange = (version: string) => {
    setAaVersion(version)
    setOpenWeightsOnly(false)
    table.replaceSelection(new Set(filterByAAVersion(allIntelligence, version).map((entry) => entry.id)))
  }

  const sources: DataSourceCredit[] = [
    { label: 'Artificial Analysis Intelligence Index v4.3', href: 'https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v4-3' },
    { label: 'HuggingFace and Unsloth', href: 'https://huggingface.co/unsloth' },
    { label: 'Wikipedia Hopper (microarchitecture)', href: 'https://en.wikipedia.org/wiki/Hopper_(microarchitecture)' },
    { label: 'NVIDIA Hopper Architecture', href: 'https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/' },
    { label: 'NVIDIA Supercharges Hopper', href: 'https://nvidianews.nvidia.com/news/nvidia-supercharges-hopper-the-worlds-leading-ai-computing-platform' },    
    { label: 'NVIDIA H200', href: 'https://www.nvidia.com/en-us/data-center/h200/' },    
    { label: 'TechPowerUp L40', href: 'https://www.techpowerup.com/gpu-specs/l40.c3959' },
    { label: 'ThunderCompute L40 Specs', href: 'https://www.thundercompute.com/blog/nvidia-l40-specs'},
    { label: 'ThunderCompute A100 Specs', href: 'https://www.thundercompute.com/blog/nvidia-a100-specs-full-guide' },
    { label: 'ThunderCompute H100 Specs', href: 'https://www.thundercompute.com/blog/nvidia-h100-specs-full-guide' },
    { label: 'NVIDIA RTX Pro 6000 Blackwell', href: 'https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000/' },
    { label: 'TechPowerUp RTX Pro 6000 Blackwell', href: 'https://www.techpowerup.com/gpu-specs/rtx-pro-6000-blackwell.c4272' },    
    { label: 'Wikipedia Blackwell (microarchitecture)', href: 'https://en.wikipedia.org/wiki/Blackwell_(microarchitecture)' },
    { label: 'Inferbase B200 SXM', href: 'https://inferbase.ai/gpu-catalog/gpu/nvidia-b200-sxm' },
  ]
  // The lead chart's source chip keeps linking to the AA homepage; only the
  // footer credit (sources[0]) links to the Intelligence Index v4.3 article.
  const intelligenceSource: DataSourceCredit = { label: 'Artificial Analysis', href: 'https://artificialanalysis.ai/' }
  const hardwareSource = sources[1]
  const gpuSources: DataSourceCredit[] = sources.slice(2)
  const footerSources: DataSourceCredit[] = sources.slice(0, 2)
  const machineSources: DataSourceCredit[] = [
    { label: 'Daring Fireball: Mac configurations and pricing', href: 'https://daringfireball.net/2026/08/configurations_and_pricing_for_new_mac_minis_and_mac_studios' },
    { label: 'NVIDIA DGX Spark', href: 'https://www.nvidia.com/en-us/products/workstations/dgx-spark/' },
    { label: 'Framework Desktop configurator', href: 'https://frame.work/products/desktop-diy-amd-aimax300/configuration/new' },
  ]

  return (
    <Dashboard
      entries={table.sorted}
      intelligenceChartEntries={table.chartEntries}
      aaVersions={aaVersions}
      aaVersion={aaVersion}
      onAAVersionChange={handleAAVersionChange}
      sort={table.sort}
      selectedIds={table.selectedIds}
      onSortChange={table.handleSortChange}
      onToggleEntry={table.handleToggleEntry}
      openWeightsOnly={openWeightsOnly}
      onToggleOpenWeights={handleToggleOpenWeights}
      news={news}
      hardware={hardware}
      hardwareSource={hardwareSource}
      gpu={gpu}
      gpuSources={gpuSources}
      machines={machines}
      machineSources={machineSources}
      intelligenceSource={intelligenceSource}
      sources={footerSources}
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
