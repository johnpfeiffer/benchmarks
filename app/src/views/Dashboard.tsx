import { Box, Chip, Container, Typography } from '@mui/material'
import type { ModelEntry, NewsItem, SortField, SortState } from '../models'
import { IntelligenceBarChart } from './IntelligenceBarChart'
import { ModelTable } from './ModelTable'
import { Footer } from './Footer'
import { NewsSection } from './NewsSection'

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
  sources: readonly DataSourceCredit[]
  newsItems: readonly NewsItem[]
}

/**
 * Dashboard layout (pure presentation).
 *
 * Progressive disclosure per DESIGN.md: a summary chart on top, details
 * (sortable table) below, sources/credit in the footer.
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
  sources,
  newsItems,
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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap',
            mb: 1,
          }}
        >
          <Typography id="intelligence-title" variant="h5" component="h2">
            Artificial Analysis Intelligence
          </Typography>
          <Chip
            size="small"
            variant="outlined"
            label="Source: Artificial Analysis"
            component="a"
            href="https://artificialanalysis.ai/"
            target="_blank"
            rel="noopener noreferrer"
            clickable
          />
        </Box>
        <IntelligenceBarChart
          entries={intelligenceChartEntries}
          scoreLabel="Score"
        />
      </Box>

      <Box component="section" sx={{ mb: 4 }}>
        <NewsSection items={newsItems} />
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
        <Typography id="swe-title" variant="h5" component="h2" sx={{ mb: 1 }}>
          Senior SWE Bench
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
            gap: 2,
            alignItems: 'start',
          }}
        >
          <IntelligenceBarChart
            entries={tastefulSweChartEntries}
            title="Tasteful Solve Rate"
            scoreLabel="tasteful_solve_rate_pct"
            fitWidth
          />
          <IntelligenceBarChart
            entries={basicSweChartEntries}
            title="Basic Solve Rate"
            scoreLabel="basic_solve_rate_pct"
            fitWidth
          />
        </Box>
      </Box>

      <Footer sources={sources} />
    </Container>
  )
}
