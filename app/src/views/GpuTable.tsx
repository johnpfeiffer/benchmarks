import { useMemo, useState } from 'react'
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
import type { GpuEntry } from '../models'

type SortField = 'model' | 'year' | 'memory' | 'memory_type' | 'memory_bandwidth_gbs' | 'fp16_tflops'
type SortDirection = 'asc' | 'desc'
interface SortState { field: SortField; direction: SortDirection }

const DEFAULT_SORT: SortState = { field: 'year', direction: 'desc' }

function fieldValue(entry: GpuEntry, field: SortField): string | number | null {
  switch (field) {
    case 'model': return entry.model
    case 'year': return entry.year
    case 'memory': return entry.memory
    case 'memory_type': return entry.memory_type
    case 'memory_bandwidth_gbs': return entry.memory_bandwidth_gbs
    case 'fp16_tflops': return entry.fp16_tflops
  }
}

function compareEntries(field: SortField, direction: SortDirection, a: GpuEntry, b: GpuEntry): number {
  const av = fieldValue(a, field)
  const bv = fieldValue(b, field)
  const aNull = av === null
  const bNull = bv === null
  if (aNull && bNull) return 0
  if (aNull) return 1
  if (bNull) return -1
  const sign = direction === 'asc' ? 1 : -1
  return (typeof av === 'number' && typeof bv === 'number'
    ? av - bv
    : String(av).localeCompare(String(bv)) as number) * sign
}

function nextSort(current: SortState, field: SortField): SortState {
  if (current.field === field) {
    return { field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
  }
  return { field, direction: 'asc' }
}

const COLUMNS: Array<{ label: string; field: SortField }> = [
  { label: 'GPU Model', field: 'model' },
  { label: 'Year', field: 'year' },
  { label: 'Memory', field: 'memory' },
  { label: 'Memory Type', field: 'memory_type' },
  { label: 'Mem BW (GB/s)', field: 'memory_bandwidth_gbs' },
  { label: 'FP16 (TFLOPS)', field: 'fp16_tflops' },
]

interface GpuTableProps {
  entries: readonly GpuEntry[]
  title: string
}

/** Sortable table of NVIDIA GPU hardware specifications. */
export function GpuTable({ entries, title }: GpuTableProps) {
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)

  const sorted = useMemo(() => {
    const copy = [...entries]
    copy.sort((a, b) => compareEntries(sort.field, sort.direction, a, b))
    return copy
  }, [entries, sort])

  const handleSortChange = (field: SortField) => {
    setSort((current) => nextSort(current, field))
  }

  return (
    <Box>
      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <TableContainer
        component={Box}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}
      >
        <Table size="small" aria-label={title}>
          <TableHead>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableCell key={col.field}>
                  <TableSortLabel
                    active={sort.field === col.field}
                    direction={sort.field === col.field ? sort.direction : 'asc'}
                    onClick={() => handleSortChange(col.field)}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((entry) => (
              <TableRow key={entry.model} hover>
                <TableCell>{entry.model}</TableCell>
                <TableCell>{entry.year}</TableCell>
                <TableCell>{entry.memory ?? '*'}</TableCell>
                <TableCell>{entry.memory_type ?? '*'}</TableCell>
                <TableCell>{entry.memory_bandwidth_gbs ?? '*'}</TableCell>
                <TableCell>{entry.fp16_tflops ?? '*'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
