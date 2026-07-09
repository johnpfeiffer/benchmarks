import { Box, Container, Typography } from '@mui/material'
import type { ModelEntry, SortField, SortState } from '../models'
import { IntelligenceBarChart } from './IntelligenceBarChart'
import { ModelTable } from './ModelTable'
import { Footer } from './Footer'

interface DashboardProps {
  entries: readonly ModelEntry[]
  sort: SortState
  onSortChange: (field: SortField) => void
}

/**
 * Dashboard layout (pure presentation).
 *
 * Progressive disclosure per DESIGN.md: a summary chart on top, details
 * (sortable table) below, sources/credit in the footer.
 */
export function Dashboard({ entries, sort, onSortChange }: DashboardProps) {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          AI Model Benchmarks
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Intelligence scores across providers, sorted highest to lowest by default.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <IntelligenceBarChart entries={entries} />
      </Box>

      <ModelTable entries={entries} sort={sort} onSortChange={onSortChange} />

      <Footer />
    </Container>
  )
}
