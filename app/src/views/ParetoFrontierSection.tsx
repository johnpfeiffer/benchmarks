import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Box, Link, Typography } from '@mui/material'
// Bundled asset (fingerprinted into dist/assets) rather than a public/ file:
// the deployed host provably serves /assets/* (the JS bundle loads), while a
// root-absolute /images/* URL can be swallowed by SPA-fallback routing on
// multi-app hosts.
import paretoFrontierUrl from '../assets/artificial-analysis-pareto-frontier.png'

/**
 * Collapsible static snapshot of Artificial Analysis' "Intelligence Index vs.
 * Cost to Run" scatter chart (the Pareto frontier view), expanded on first
 * render like the news section. The underlying chart is interactive on the
 * source site; this is a captured image, credited and linked.
 */
export function ParetoFrontierSection() {
  return (
    <Box component="section" aria-labelledby="pareto-title">
      <Accordion defaultExpanded disableGutters variant="outlined">
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="pareto-content" id="pareto-header">
          <Typography id="pareto-title" variant="h6" component="span">
            Pareto frontier
          </Typography>
        </AccordionSummary>
        <AccordionDetails id="pareto-content" sx={{ pt: 0 }}>
          <Box
            component="img"
            src={paretoFrontierUrl}
            alt="Artificial Analysis scatter chart of Intelligence Index versus cost to run the benchmark (USD, log scale), with the dotted Pareto frontier line and provider-colored model dots"
            sx={{
              display: 'block',
              width: '100%',
              maxWidth: 1100,
              height: 'auto',
              borderRadius: 1,
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Intelligence Index vs. cost to run the benchmark (USD, log scale); dotted line marks the
            Pareto frontier. Chart:{' '}
            <Link href="https://artificialanalysis.ai/" target="_blank" rel="noopener noreferrer">
              Artificial Analysis
            </Link>
            , captured 2026-08-27.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}
