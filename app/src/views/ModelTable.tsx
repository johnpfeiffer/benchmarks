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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import type { SortField, SortState } from '../models'
import type { ModelEntry } from '../models'

interface ModelTableProps {
  /** Entries already sorted by the controller. */
  entries: readonly ModelEntry[]
  /** Index versions present in the data, newest first. */
  aaVersions: readonly string[]
  /** Index version the rows belong to. */
  aaVersion: string
  /** Called when the summary's version selector is used. */
  onAAVersionChange: (version: string) => void
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
  { label: 'Intelligence', field: 'score', accessor: (e) => e.score },
  { label: 'Model Name', field: 'model', accessor: (e) => e.model },
  { label: 'Provider', field: 'provider', accessor: (e) => e.provider },
  { label: 'Released', field: 'released', accessor: (e) => e.released ?? undefined },
  { label: 'Benchmark cost USD', field: 'cost', accessor: (e) => e.cost_usd },
]

/** Same USD formatting as the Pareto chart: cents only when they exist. */
const formatCost = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value)

/**
 * Sortable, collapsible table of model benchmarks, collapsed by default (the
 * chart above already summarizes the ranking; per DESIGN.md progressive
 * disclosure).
 *
 * Pure presentation: renders the given (already-sorted) rows and emits header
 * clicks. All sort logic lives in the controller / models layer. The "Open
 * Weights" toggle sits immediately to the right of the title in the accordion
 * summary; clicking it does not toggle the accordion.
 */
export function ModelTable({ entries, aaVersions, aaVersion, onAAVersionChange, sort, onSortChange, selectedIds, onToggleEntry, title, openWeightsOnly, onToggleOpenWeights }: ModelTableProps) {
  return (
    <Box>
      <Accordion disableGutters variant="outlined">
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="details-content" id="details-header">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" component="span">
              {title}
            </Typography>
            {aaVersions.length > 1 && (
              // Same ToggleButtonGroup as the chart header's version selector;
              // clicks stay local so the accordion does not toggle.
              <ToggleButtonGroup
                size="small"
                exclusive
                value={aaVersion}
                onClick={(e) => e.stopPropagation()}
                onChange={(_, next) => {
                  // MUI emits null when the selected button is clicked again.
                  if (next !== null) onAAVersionChange(next)
                }}
                aria-label="Intelligence Index version"
              >
                {aaVersions.map((version) => (
                  <ToggleButton key={version} value={version}>
                    {version}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            )}
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
                          {col.field === 'released' ? (
                            // Release dates render in italics per design; "*"
                            // when the date is unknown. <em> carries the style
                            // semantically and survives in the DOM for tests.
                            <em>{col.accessor(entry) ?? '*'}</em>
                          ) : col.field === 'cost' ? (
                            // Total benchmark run cost in USD; "*" when AA
                            // publishes no precise total for this model.
                            col.accessor(entry) !== undefined ? formatCost(col.accessor(entry) as number) : '*'
                          ) : col.field === 'model' ? (
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
          <Typography
            variant="caption"
            component="p"
            color="text.secondary"
            sx={{ px: 2, py: 1, m: 0, fontStyle: 'italic' }}
          >
            USD Cost to Run Artificial Analysis Intelligence Index
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}
