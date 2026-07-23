import { useMemo, useState } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Box, Link, SvgIcon, TableSortLabel, Typography } from '@mui/material'
import type { NewsEntry } from '../models'

interface NewsSectionProps {
  /** Entries already validated and sorted newest first by the controller. */
  entries: readonly NewsEntry[]
}

/** A small fresh-tomato mark for the "Hand Picked News" header. */
function TomatoIcon(props: { fontSize?: 'small' | 'medium' | 'large' }) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {/* Stem */}
      <path d="M12 3v3.5" stroke="#2e7d32" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Calyx (green sepal) */}
      <path
        d="M12 7 C10 6 8 6.5 7 8 C8.5 7.3 10.3 7.8 12 8.8 C13.7 7.8 15.5 7.3 17 8 C16 6.5 14 6 12 7 Z"
        fill="#43a047"
      />
      {/* Body */}
      <circle cx="12" cy="15" r="7" fill="#e53935" />
      {/* Specular highlight */}
      <ellipse cx="9.5" cy="13" rx="2.2" ry="1.3" fill="#ef5350" opacity="0.55" />
    </SvgIcon>
  )
}

type NewsSortDirection = 'asc' | 'desc'

/**
 * Collapsible list of benchmark news links, expanded on first render.
 *
 * Each row shows the publication date in an unobtrusive light-gray left column
 * and the URL as a link. The date column header is a subtle TableSortLabel that
 * toggles between descending (default, newest first) and ascending.
 */
export function NewsSection({ entries }: NewsSectionProps) {
  const [sortDirection, setSortDirection] = useState<NewsSortDirection>('desc')

  const sortedEntries = useMemo(() => {
    const ascending = [...entries].sort((a, b) => a.date.localeCompare(b.date))
    return sortDirection === 'asc' ? ascending : ascending.reverse()
  }, [entries, sortDirection])

  const handleSortToggle = () => {
    setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))
  }

  return (
    <Box component="section" aria-labelledby="news-title">
      <Accordion defaultExpanded disableGutters variant="outlined">
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="news-content" id="news-header">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <TomatoIcon fontSize="small" />
            <Typography id="news-title" variant="h6" component="span">
              Hand Picked News
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails id="news-content" sx={{ pt: 0 }}>
          <Box sx={{ mb: 1, pl: 0 }}>
            <TableSortLabel
              active
              direction={sortDirection}
              onClick={handleSortToggle}
              aria-label="Sort news by date"
              sx={{
                '& .MuiTableSortLabel-icon': { opacity: 0.4 },
                '&:hover .MuiTableSortLabel-icon': { opacity: 0.7 },
              }}
            >
              <Typography variant="caption" color="text.disabled">
                Date
              </Typography>
            </TableSortLabel>
          </Box>
          <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
            {sortedEntries.map((entry) => (
              <Box
                component="li"
                key={`${entry.date}:${entry.url}`}
                sx={{ display: 'flex', gap: 1.5, mb: 0.75, '&:last-child': { mb: 0 } }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: 'text.disabled', flexShrink: 0, minWidth: '5.5em' }}
                >
                  {entry.date}
                </Typography>
                <Link
                  href={entry.url}
                  title={entry.date}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ overflowWrap: 'anywhere' }}
                >
                  {entry.url}
                </Link>
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}
