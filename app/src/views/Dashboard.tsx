import { Box, Button, Container, Link, Typography } from '@mui/material'
import type { GpuEntry, HardwareEntry, ModelEntry, NewsEntry, SortField, SortState } from '../models'
import { IntelligenceBarChart } from './IntelligenceBarChart'
import { ModelTable } from './ModelTable'
import { Footer } from './Footer'
import { NewsSection } from './NewsSection'
import { ParetoFrontierSection } from './ParetoFrontierSection'
import { HardwareChart } from './HardwareChart'
import { HardwareTable } from './HardwareTable'
import { GpuTable } from './GpuTable'

export interface DataSourceCredit {
  label: string
  href: string
}

interface DashboardProps {
  entries: readonly ModelEntry[]
  intelligenceChartEntries: readonly ModelEntry[]
  tastefulSweChartEntries: readonly ModelEntry[]
  basicSweChartEntries: readonly ModelEntry[]
  sort: SortState
  selectedIds: ReadonlySet<string>
  onSortChange: (field: SortField) => void
  onToggleEntry: (id: string) => void
  openWeightsOnly: boolean
  onToggleOpenWeights: () => void
  news: readonly NewsEntry[]
  hardware: readonly HardwareEntry[]
  hardwareSource: DataSourceCredit
  sweSource: DataSourceCredit
  gpu: readonly GpuEntry[]
  gpuSources: readonly DataSourceCredit[]
  intelligenceSource: DataSourceCredit
  sources: readonly DataSourceCredit[]
}

/**
 * Dashboard layout (pure presentation).
 *
 * Progressive disclosure per DESIGN.md: a summary chart on top, collapsible
 * news and sortable details below, then sources/credit in the footer.
 */
export function Dashboard({
  entries,
  intelligenceChartEntries,
  tastefulSweChartEntries,
  basicSweChartEntries,
  sort,
  selectedIds,
  onSortChange,
  onToggleEntry,
  openWeightsOnly,
  onToggleOpenWeights,
  news,
  hardware,
  hardwareSource,
  sweSource,
  gpu,
  gpuSources,
  intelligenceSource,
  sources,
}: DashboardProps) {
  return (
    <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          AI Model Benchmarks
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Model benchmark scores across providers, sorted highest to lowest by default.
        </Typography>
      </Box>

      <Box component="section" aria-labelledby="intelligence-title" sx={{ mb: 4 }}>
        <Typography id="intelligence-title" variant="h5" component="h2" sx={{ mb: 1 }}>
          Artificial Analysis Intelligence
        </Typography>
        <IntelligenceBarChart
          entries={intelligenceChartEntries}
          scoreLabel="Score"
          source={intelligenceSource}
        />
      </Box>

      <Box sx={{ mb: 4 }}>
        <NewsSection entries={news} />
      </Box>

      <Box sx={{ mb: 4 }}>
        <ParetoFrontierSection />
      </Box>

      <Box component="section" aria-labelledby="details-title" sx={{ mb: 5 }}>
        <ModelTable
          entries={entries}
          sort={sort}
          onSortChange={onSortChange}
          selectedIds={selectedIds}
          onToggleEntry={onToggleEntry}
          title="Model Details"
          openWeightsOnly={openWeightsOnly}
          onToggleOpenWeights={onToggleOpenWeights}
        />
      </Box>

      <Box component="section" aria-labelledby="swe-title" sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography id="swe-title" variant="h5" component="h2">
            Senior SWE Bench
          </Typography>
          <Button
            size="small"
            variant={openWeightsOnly ? 'contained' : 'outlined'}
            color={openWeightsOnly ? 'primary' : 'inherit'}
            aria-pressed={openWeightsOnly}
            onClick={onToggleOpenWeights}
            sx={{ textTransform: 'none' }}
          >
            Open Weights
          </Button>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
            gap: 2,
            alignItems: 'start',
          }}
        >
          <IntelligenceBarChart
            entries={basicSweChartEntries}
            title="Basic Solve Rate"
            scoreLabel="basic_solve_rate_pct"
            fitWidth
            source={sweSource}
          />
          <IntelligenceBarChart
            entries={tastefulSweChartEntries}
            title="Tasteful Solve Rate"
            scoreLabel="tasteful_solve_rate_pct"
            fitWidth
            source={sweSource}
          />
        </Box>
        <Typography
          variant="body2"
          sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}
        >
          mini-swe-agent is minimal - a better harness like terminus or pi will
          perform better.{' '}
          <Link
            href="https://blog.john-pfeiffer.com/reproducing-a-coding-benchmark-with-harbor-and-terminal-bench-21/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source
          </Link>
        </Typography>
      </Box>

      <Box component="section" aria-labelledby="hardware-title" sx={{ mb: 5 }}>
        <Typography id="hardware-title" variant="h5" component="h2" sx={{ mb: 1 }}>
          HuggingFace Estimated Hardware
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          1-bit dynamic quant (UD-IQ1) estimated sizes from Unsloth GGUF releases.
        </Typography>
        <HardwareChart entries={hardware} source={hardwareSource} />
        <Box sx={{ mt: 3 }}>
          <HardwareTable entries={hardware} title="Open Weight Hosting Sizes" />
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

      <Footer sources={sources} />
    </Container>
  )
}
