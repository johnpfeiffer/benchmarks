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
import type { HardwareEntry } from '../models'

type SortField = 'model' | 'provider' | 'total_params' | 'iq1_s_gb' | 'iq1_m_gb' | 'iq2_xxs_gb' | 'iq2_m_gb'
type SortDirection = 'asc' | 'desc'
interface SortState { field: SortField; direction: SortDirection }

const DEFAULT_SORT: SortState = { field: 'total_params', direction: 'desc' }

/** Parse a param string like "264B" or "2.8T" into billions for numeric sorting. */
function paramsInBillions(value: string): number {
  const match = value.match(/^([\d.]+)\s*([TBM])/i)
  if (!match) return 0
  const amount = Number(match[1])
  const suffix = match[2].toUpperCase()
  if (suffix === 'T') return amount * 1000
  if (suffix === 'B') return amount
  if (suffix === 'M') return amount / 1000
  return amount
}

function fieldValue(entry: HardwareEntry, field: SortField): string | number | null {
  switch (field) {
    case 'model': return entry.model
    case 'provider': return entry.provider
    case 'total_params': return paramsInBillions(entry.total_params)
    case 'iq1_s_gb': return entry.iq1_s_gb
    case 'iq1_m_gb': return entry.iq1_m_gb
    case 'iq2_xxs_gb': return entry.iq2_xxs_gb
    case 'iq2_m_gb': return entry.iq2_m_gb
  }
}

function compareEntries(field: SortField, direction: SortDirection, a: HardwareEntry, b: HardwareEntry): number {
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
  { label: 'Model', field: 'model' },
  { label: 'Provider', field: 'provider' },
  { label: 'Total Params', field: 'total_params' },
  { label: 'UD-IQ1_S (GB)', field: 'iq1_s_gb' },
  { label: 'UD-IQ1_M (GB)', field: 'iq1_m_gb' },
  { label: 'UD-IQ2_XXS (GB)', field: 'iq2_xxs_gb' },
  { label: 'UD-IQ2_M (GB)', field: 'iq2_m_gb' },
]

interface HardwareTableProps {
  entries: readonly HardwareEntry[]
  title: string
}

/** Sortable table of HuggingFace estimated hardware sizes for 1-bit dynamic quants. */
export function HardwareTable({ entries, title }: HardwareTableProps) {
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
              <TableRow key={`${entry.provider}:${entry.model}`} hover>
                <TableCell>
                  <Link href={entry.url} target="_blank" rel="noopener noreferrer">
                    {entry.model}
                  </Link>
                </TableCell>
                <TableCell>{entry.provider}</TableCell>
                <TableCell>{entry.total_params}</TableCell>
                <TableCell>{entry.iq1_s_gb ?? '*'}</TableCell>
                <TableCell>{entry.iq1_m_gb ?? '*'}</TableCell>
                <TableCell>{entry.iq2_xxs_gb ?? '*'}</TableCell>
                <TableCell>{entry.iq2_m_gb ?? '*'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
