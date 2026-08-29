import { useMemo, useState } from 'react'
import {
  Box,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableSortLabel,
  TableRow,
  Typography,
} from '@mui/material'
import type { MachineEntry } from '../models'

type SortField = 'machine' | 'chip' | 'vram_gb' | 'memory_bandwidth_gbs' | 'price_usd'
type SortDirection = 'asc' | 'desc'
interface SortState { field: SortField; direction: SortDirection }

const DEFAULT_SORT: SortState = { field: 'vram_gb', direction: 'desc' }

function fieldValue(entry: MachineEntry, field: SortField): string | number | null {
  switch (field) {
    case 'machine': return entry.machine
    case 'chip': return entry.chip
    case 'vram_gb': return entry.vram_gb
    case 'memory_bandwidth_gbs': return entry.memory_bandwidth_gbs
    case 'price_usd': return entry.price_usd
  }
}

function compareEntries(field: SortField, direction: SortDirection, a: MachineEntry, b: MachineEntry): number {
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
  { label: 'Machine', field: 'machine' },
  { label: 'Chip', field: 'chip' },
  { label: 'Unified Memory (GB)', field: 'vram_gb' },
  { label: 'Mem BW (GB/s)', field: 'memory_bandwidth_gbs' },
  { label: 'Price (USD)', field: 'price_usd' },
]

function formatPrice(price_usd: number | null): string {
  return price_usd === null ? '*' : `$${price_usd.toLocaleString('en-US')}`
}

interface LocalHardwareTableProps {
  entries: readonly MachineEntry[]
  title: string
}

/** Sortable table of unified-memory machines for running open-weight models locally. */
export function LocalHardwareTable({ entries, title }: LocalHardwareTableProps) {
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
              <TableRow key={entry.machine} hover>
                <TableCell>
                  <Link href={entry.url} target="_blank" rel="noopener noreferrer">
                    {entry.machine}
                  </Link>
                </TableCell>
                <TableCell>{entry.chip}</TableCell>
                <TableCell>{entry.vram_gb}</TableCell>
                <TableCell>{entry.memory_bandwidth_gbs ?? '*'}</TableCell>
                <TableCell>{formatPrice(entry.price_usd)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
