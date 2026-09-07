import { useMemo, useState } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, ButtonBase, Collapse, Link, SvgIcon, TableSortLabel, Typography } from '@mui/material'
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

/** One dated news link row, shared by the preview and the expanded list. */
function NewsRow({ entry, last }: { entry: NewsEntry; last: boolean }) {
  return (
    <Box
      component="li"
      sx={{ display: 'flex', gap: 1.5, mb: last ? 0 : 0.75 }}
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
  )
}

/**
 * Collapsible list of benchmark news links, collapsed on first render.
 *
 * The top 3 entries of the current sort stay visible below the header;
 * clicking the header expands the section to reveal the remaining entries.
 * (MUI Accordion would swallow every child after the summary into the
 * collapsed region, so the disclosure is built from ButtonBase + Collapse to
 * keep the preview outside it.) Each row shows the publication date in an
 * unobtrusive light-gray left column and the URL as a link. The date column
 * header is a subtle TableSortLabel that toggles between descending (default,
 * newest first) and ascending.
 */
export function NewsSection({ entries }: NewsSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const [sortDirection, setSortDirection] = useState<NewsSortDirection>('desc')

  const sortedEntries = useMemo(() => {
    const ascending = [...entries].sort((a, b) => a.date.localeCompare(b.date))
    return sortDirection === 'asc' ? ascending : ascending.reverse()
  }, [entries, sortDirection])

  const previewEntries = sortedEntries.slice(0, 3)
  const restEntries = sortedEntries.slice(3)

  const handleToggle = () => setExpanded((current) => !current)
  const handleSortToggle = () => {
    setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))
  }

  return (
    <Box component="section" aria-labelledby="news-title">
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Typography variant="h6" component="h3" id="news-title" sx={{ m: 0 }}>
          <ButtonBase
            onClick={handleToggle}
            aria-expanded={expanded}
            aria-controls="news-content"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              width: '100%',
              px: 2,
              py: 1,
              justifyContent: 'flex-start',
              fontWeight: 'inherit',
              fontSize: 'inherit',
            }}
          >
            <TomatoIcon fontSize="small" />
            <Box component="span" sx={{ flexGrow: 1, textAlign: 'left' }}>
              Hand Picked News
            </Box>
            <ExpandMoreIcon
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 150ms',
              }}
            />
          </ButtonBase>
        </Typography>
        <Box component="ul" sx={{ m: 0, px: 2, pb: 1, pt: 0, listStyle: 'none' }}>
          {previewEntries.map((entry, index) => (
            <NewsRow key={`${entry.date}:${entry.url}`} entry={entry} last={index === previewEntries.length - 1} />
          ))}
        </Box>
        <Collapse in={expanded} timeout="auto">
          <Box id="news-content" sx={{ px: 2, pb: 1.5 }}>
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
              {restEntries.map((entry, index) => (
                <NewsRow key={`${entry.date}:${entry.url}`} entry={entry} last={index === restEntries.length - 1} />
              ))}
            </Box>
          </Box>
        </Collapse>
      </Box>
    </Box>
  )
}
