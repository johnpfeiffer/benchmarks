import { useState } from 'react'
import { Box, Container, Link, Typography } from '@mui/material'
import type { GpuEntry, HardwareEntry, MachineEntry, ModelEntry, NewsEntry, SortField, SortState } from '../models'
import { IntelligenceBarChart } from './IntelligenceBarChart'
import { ModelTable } from './ModelTable'
import { HISTORICAL_AA_VERSIONS, HistoricalIntelligenceCharts } from './HistoricalIntelligenceCharts'
import { Footer } from './Footer'
import { NewsSection } from './NewsSection'
import { ParetoFrontierSection } from './ParetoFrontierSection'
import { HardwareChart } from './HardwareChart'
import { HardwareTable } from './HardwareTable'
import { GpuTable } from './GpuTable'
import { LocalHardwareTable } from './LocalHardwareTable'

export interface DataSourceCredit {
  label: string
  href: string
}

interface DashboardProps {
  entries: readonly ModelEntry[]
  intelligenceChartEntries: readonly ModelEntry[]
  /** Index versions present in ai.json, newest first. */
  aaVersions: readonly string[]
  /** The version currently shown in the chart and details table. */
  aaVersion: string
  onAAVersionChange: (version: string) => void
  sort: SortState
  selectedIds: ReadonlySet<string>
  onSortChange: (field: SortField) => void
  onToggleEntry: (id: string) => void
  openWeightsOnly: boolean
  onToggleOpenWeights: () => void
  news: readonly NewsEntry[]
  hardware: readonly HardwareEntry[]
  hardwareSource: DataSourceCredit
  gpu: readonly GpuEntry[]
  gpuSources: readonly DataSourceCredit[]
  machines: readonly MachineEntry[]
  machineSources: readonly DataSourceCredit[]
  intelligenceSource: DataSourceCredit
  sources: readonly DataSourceCredit[]
}

/**
 * Dashboard layout. Presentation only except one piece of local UI state:
 * whether the historical-charts expander is open, so the chart's predate
 * note can open it. All data flow stays with the controller (App.tsx).
 *
 * Progressive disclosure per DESIGN.md: a summary chart on top, the sortable
 * details table (carrying the index-version selector in its summary)
 * directly below it, then collapsible news, then sources/credit in the
 * footer.
 */
export function Dashboard({
  entries,
  intelligenceChartEntries,
  aaVersions,
  aaVersion,
  onAAVersionChange,
  sort,
  selectedIds,
  onSortChange,
  onToggleEntry,
  openWeightsOnly,
  onToggleOpenWeights,
  news,
  hardware,
  hardwareSource,
  gpu,
  gpuSources,
  machines,
  machineSources,
  intelligenceSource,
  sources,
}: DashboardProps) {
  // Local UI state only: lets the chart's predate note open the historical
  // charts section. All data flow stays with the controller.
  const [historicalExpanded, setHistoricalExpanded] = useState(false)
  return (
    <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          AI Model Benchmarks
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          Best effort on a moving target - your own use cases and evals may differ
        </Typography>
      </Box>

      <Box component="section" aria-labelledby="intelligence-title" sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <Typography id="intelligence-title" variant="h5" component="h2">
            Artificial Analysis Intelligence
          </Typography>
          <Link
            href={intelligenceSource.href}
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
            color="text.secondary"
          >
            Source
          </Link>
        </Box>
        <IntelligenceBarChart
          entries={intelligenceChartEntries}
          scoreLabel="Score"
          barValues
        />
        {HISTORICAL_AA_VERSIONS.includes(aaVersion) && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            <Link href="#historical-aa-title" onClick={() => setHistoricalExpanded(true)}>
              Scores and costs predate the current index version
            </Link>
          </Typography>
        )}
      </Box>

      {/* Model Details sits directly below the chart and is the control
          center: its summary carries the only index-version selector, driving
          both the chart above and the table inside. */}
      <Box component="section" aria-labelledby="details-title" sx={{ mb: 4 }}>
        <ModelTable
          entries={entries}
          aaVersions={aaVersions}
          aaVersion={aaVersion}
          onAAVersionChange={onAAVersionChange}
          sort={sort}
          onSortChange={onSortChange}
          selectedIds={selectedIds}
          onToggleEntry={onToggleEntry}
          title="Model Details"
          openWeightsOnly={openWeightsOnly}
          onToggleOpenWeights={onToggleOpenWeights}
        />
      </Box>

      <Box sx={{ mb: 4 }}>
        <NewsSection entries={news} />
      </Box>

      <Box sx={{ mb: 4 }}>
        <ParetoFrontierSection />
      </Box>

      <Box sx={{ mb: 5 }}>
        <HistoricalIntelligenceCharts expanded={historicalExpanded} onExpandedChange={setHistoricalExpanded} />
      </Box>

      <Box component="section" aria-labelledby="hardware-title" sx={{ mb: 5 }}>
        <Typography id="hardware-title" variant="h5" component="h2" sx={{ mb: 1 }}>
          HuggingFace Estimated Hardware
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Dynamic quant (UD-IQ1_M, UD-Q2_K_XL, UD-Q4_K_XL) estimated sizes from Unsloth GGUF releases.
        </Typography>
        <HardwareChart entries={hardware} source={hardwareSource} />
        <Box sx={{ mt: 3 }}>
          <HardwareTable entries={hardware} title="Unsloth Open Weight Hosting Sizes" />
        </Box>
      </Box>

      <Box component="section" aria-labelledby="gpu-title" sx={{ mb: 5 }}>
        <Typography id="gpu-title" variant="h5" component="h2" sx={{ mb: 1 }}>
          Hardware
        </Typography>
        <GpuTable entries={gpu} title="GPU Specifications" />
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {gpuSources.map((src) => (
            <Link
              key={src.href}
              href={src.href}
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
            >
              {src.label}
            </Link>
          ))}
        </Box>
      </Box>

      <Box component="section" aria-labelledby="local-hw-title" sx={{ mb: 5 }}>
        <Typography id="local-hw-title" variant="h5" component="h2" sx={{ mb: 1 }}>
          Local Hardware
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Unified-memory machines that run open-weight models locally. Memory is
          shared between CPU and GPU; the largest configuration per machine is
          shown with its price. The Framework DIY Edition price includes the
          required SSD and CPU fan (~$240) on top of the base system.
        </Typography>
        <LocalHardwareTable entries={machines} title="Local AI Machines" />
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {machineSources.map((src) => (
            <Link
              key={src.href}
              href={src.href}
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
            >
              {src.label}
            </Link>
          ))}
        </Box>
      </Box>

      <Footer sources={sources} />
    </Container>
  )
}
