import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Box, Link, Typography } from '@mui/material'
import type { NewsEntry } from '../models'

interface NewsSectionProps {
  /** Entries already validated and sorted newest first by the controller. */
  entries: readonly NewsEntry[]
}

/** Collapsible list of benchmark news links, expanded on first render. */
export function NewsSection({ entries }: NewsSectionProps) {
  return (
    <Box component="section" aria-labelledby="news-title">
      <Accordion defaultExpanded disableGutters variant="outlined">
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="news-content" id="news-header">
          <Typography id="news-title" variant="h6" component="span">
            News
          </Typography>
        </AccordionSummary>
        <AccordionDetails id="news-content">
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {entries.map((entry) => (
              <Box component="li" key={`${entry.date}:${entry.url}`} sx={{ mb: 0.75, '&:last-child': { mb: 0 } }}>
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
