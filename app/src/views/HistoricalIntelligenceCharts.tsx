import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Box, Link, Typography } from '@mui/material'

// Public assets, relative to the host-injected <base href="/benchmarks/">.
// A leading slash would bypass that base and request the wrong app's root.
const indexImageUrl = 'images/2025-12-30-artificial-analysis-index.png'
const costImageUrl = 'images/2025-12-30-artificial-analysis-index-eval-cost-usd.png'

const imageSx = {
  display: 'block',
  width: '100%',
  maxWidth: 1100,
  height: 'auto',
  borderRadius: 1,
} as const

/**
 * Collapsed-by-default expander below Model Details holding the captured
 * 2025-12-30 Artificial Analysis charts (Intelligence Index v3.0), kept for
 * reference alongside the live version-switched chart above.
 */
export function HistoricalIntelligenceCharts() {
  return (
    <Box component="section" aria-labelledby="historical-aa-title">
      <Accordion disableGutters variant="outlined">
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="historical-aa-content" id="historical-aa-header">
          <Typography id="historical-aa-title" variant="h6" component="span">
            Historical Artificial Analysis Intelligence charts
          </Typography>
        </AccordionSummary>
        <AccordionDetails id="historical-aa-content">
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Intelligence Index v3.0 charts captured 2025-12-30 from{' '}
            <Link href="https://artificialanalysis.ai/" target="_blank" rel="noopener noreferrer">
              Artificial Analysis
            </Link>
            . Scores and costs predate the current index version; use the version toggle on the
            main chart for the v3.0 numbers in interactive form.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              component="img"
              src={indexImageUrl}
              alt="Artificial Analysis Intelligence Index v3.0 bar chart captured 2025-12-30, ranking models by intelligence score with Gemini 3 Pro Preview (high) and GPT-5.2 (xhigh) leading at 73"
              sx={imageSx}
            />
            <Box
              component="img"
              src={costImageUrl}
              alt="Artificial Analysis bar chart captured 2025-12-30 of the USD cost to run the Intelligence Index per model, with Grok 4 the most expensive at 1888 dollars"
              sx={imageSx}
            />
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}
