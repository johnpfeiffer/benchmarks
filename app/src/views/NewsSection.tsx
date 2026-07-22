import { Accordion, AccordionSummary, AccordionDetails, Box, Link, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { NewsItem } from '../models'

interface NewsSectionProps {
  items: readonly NewsItem[]
}

/**
 * Collapsible news section below the lead intelligence chart.
 *
 * Starts expanded (per user request). Each item renders as a plain URL link;
 * hovering shows the article date via the native `title` tooltip.
 * Items are pre-sorted by the controller (newest first).
 */
export function NewsSection({ items }: NewsSectionProps) {
  return (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6" component="span">
          News
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No news articles.
          </Typography>
        ) : (
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            {items.map((item) => (
              <li key={item.url}>
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={item.date}
                >
                  {item.url}
                </Link>
              </li>
            ))}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  )
}
