import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
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
  selectedIds: ReadonlySet<string>
  onToggleEntry: (id: string) => void
  title: string
  openWeightsOnly: boolean
  onToggleOpenWeights: () => void
}

/** Column config: header label -> domain sort field + cell accessor. */
const COLUMNS: Array<{ label: string; field: SortField; accessor: (e: ModelEntry) => string | number | undefined }> = [
  { label: 'Provider', field: 'provider', accessor: (e) => e.provider },
  { label: 'Model Name', field: 'model', accessor: (e) => e.model },
  { label: 'Intelligence', field: 'score', accessor: (e) => e.score },
  { label: 'basic_solve_rate_pct', field: 'basic_solve_rate_pct', accessor: (e) => e.basic_solve_rate_pct },
  { label: 'tasteful_solve_rate_pct', field: 'tasteful_solve_rate_pct', accessor: (e) => e.tasteful_solve_rate_pct },
  { label: 'avg_steps', field: 'avg_steps', accessor: (e) => e.avg_steps },
  { label: 'avg_tokens', field: 'avg_tokens', accessor: (e) => e.avg_tokens },
]

/**
 * Sortable, collapsible table of model benchmarks.
 *
 * Pure presentation: renders the given (already-sorted) rows and emits header
 * clicks. All sort logic lives in the controller / models layer. The "Open
 * Weights" toggle sits immediately to the right of the title in the accordion
 * summary; clicking it does not toggle the accordion.
 */
export function ModelTable({ entries, sort, onSortChange, selectedIds, onToggleEntry, title, openWeightsOnly, onToggleOpenWeights }: ModelTableProps) {
  return (
    <Box>
      <Accordion defaultExpanded disableGutters variant="outlined">
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="details-content" id="details-header">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" component="span">
              {title}
            </Typography>
            <Button
              size="small"
              variant={openWeightsOnly ? 'contained' : 'outlined'}
              color={openWeightsOnly ? 'primary' : 'inherit'}
              aria-pressed={openWeightsOnly}
              onClick={(e) => { e.stopPropagation(); onToggleOpenWeights() }}
              sx={{ textTransform: 'none' }}
            >
              Open Weights
            </Button>
          </Box>
        </AccordionSummary>
        <AccordionDetails id="details-content" sx={{ p: 0 }}>
          <TableContainer
            component={Box}
            sx={{ overflowX: 'auto' }}
          >
            <Table size="small" aria-label={title}>
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
                {entries.map((entry) => {
                  const isSelected = selectedIds.has(entry.id)
                  return (
                    <TableRow
                      key={entry.id}
                      hover
                      sx={{
                        bgcolor: isSelected ? 'inherit' : 'action.disabledBackground',
                        '& .MuiTableCell-root': {
                          color: isSelected ? undefined : 'text.disabled',
                        },
                        '&:hover': {
                          bgcolor: isSelected ? undefined : 'action.disabledBackground',
                        },
                      }}
                    >
                      {COLUMNS.map((col) => (
                        <TableCell key={col.field}>
                          {col.field === 'model' ? (
                            <Button
                              size="small"
                              variant={isSelected ? 'text' : 'contained'}
                              color={isSelected ? 'primary' : 'inherit'}
                              aria-pressed={isSelected}
                              onClick={() => onToggleEntry(entry.id)}
                              sx={{
                                justifyContent: 'flex-start',
                                maxWidth: '100%',
                                minWidth: 0,
                                textAlign: 'left',
                                textTransform: 'none',
                                whiteSpace: 'normal',
                                opacity: isSelected ? 1 : 0.6,
                              }}
                            >
                              {entry.model}
                            </Button>
                          ) : (
                            col.accessor(entry) ?? '*'
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}
