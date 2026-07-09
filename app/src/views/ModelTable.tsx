import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableSortLabel,
  TableRow,
  Typography,
} from '@mui/material'
import type { SortField, SortState } from '../models'
import type { ModelEntry } from '../models'

interface ModelTableProps {
  /** Entries already sorted by the controller. */
  entries: readonly ModelEntry[]
  sort: SortState
  /** Called when a header is clicked; the controller decides the next state. */
  onSortChange: (field: SortField) => void
}

/** Column config: header label -> domain sort field + cell accessor. */
const COLUMNS: Array<{ label: string; field: SortField; accessor: (e: ModelEntry) => string | number }> = [
  { label: 'Provider', field: 'provider', accessor: (e) => e.provider },
  { label: 'Model Name', field: 'model', accessor: (e) => e.model },
  { label: 'Score', field: 'score', accessor: (e) => e.score },
]

/**
 * Sortable table of model benchmarks.
 *
 * Pure presentation: renders the given (already-sorted) rows and emits header
 * clicks. All sort logic lives in the controller / models layer.
 */
export function ModelTable({ entries, sort, onSortChange }: ModelTableProps) {
  return (
    <Box>
      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
        Model Details
      </Typography>
      <TableContainer
        component={Box}
        sx={{ maxHeight: 480, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflowY: 'auto' }}
      >
        <Table stickyHeader size="small" aria-label="model benchmarks">
          <TableHead>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableCell key={col.field}>
                  <TableSortLabel
                    active={sort.field === col.field}
                    direction={sort.field === col.field ? sort.direction : 'asc'}
                    onClick={() => onSortChange(col.field)}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={`${entry.provider}-${entry.model}`} hover>
                {COLUMNS.map((col) => (
                  <TableCell key={col.field}>{col.accessor(entry)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
