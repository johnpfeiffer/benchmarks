import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Box, Link, Typography } from '@mui/material'

// Public assets, relative to the host-injected <base href="/benchmarks/">.
// A leading slash would bypass that base and request the wrong app's root.

interface HistoricalSnapshot {
  /** Index version these captures belong to. */
  version: string
  /** Capture date (YYYY-MM-DD) of the charts. */
  captured: string
  /** Archived AA methodology page describing this index version. */
  methodologyUrl: string
  indexImage: { src: string; alt: string }
  costImage: { src: string; alt: string }
}

/**
 * Captured Artificial Analysis charts per historical index version, newest
 * version first (matching the dashboard's version ordering). Each snapshot
 * links to its version's methodology page as archived by the Wayback Machine,
 * since AA replaces the live page when a new methodology ships.
 */
export const HISTORICAL_SNAPSHOTS: readonly HistoricalSnapshot[] = [
  {
    version: 'v4.1.1',
    captured: '2026-08-11',
    methodologyUrl:
      'https://web.archive.org/web/20260811173412/https://artificialanalysis.ai/methodology/intelligence-benchmarking',
    indexImage: {
      src: 'images/2026-08-11-artificial-analysis-index.png',
      alt: 'Artificial Analysis Intelligence Index v4.1.1 bar chart captured 2026-08-11, ranking models by intelligence score with Claude Opus 5 (max) and Claude Opus 5 (xhigh) leading at 63',
    },
    costImage: {
      src: 'images/2026-08-11-artificial-analysis-index-eval-cost-usd.png',
      alt: 'Artificial Analysis bar chart captured 2026-08-11 of the USD cost to run the Intelligence Index per model, with Claude Fable 5 (max) the most expensive at 5455 dollars',
    },
  },
  {
    version: 'v4.0.2',
    captured: '2026-02-19',
    methodologyUrl:
      'https://web.archive.org/web/20260217215328/https://artificialanalysis.ai/methodology/intelligence-benchmarking',
    indexImage: {
      src: 'images/2026-02-19-artificial-analysis-index.png',
      alt: 'Artificial Analysis Intelligence Index v4.0.2 bar chart captured 2026-02-19, ranking models by intelligence score with Claude Opus 4.6 (max) leading at 53',
    },
    costImage: {
      src: 'images/2026-02-19-artificial-analysis-index-eval-cost-usd.png',
      alt: 'Artificial Analysis bar chart captured 2026-02-19 of the USD cost to run the Intelligence Index per model, with Claude Opus 4.6 (max) the most expensive at 2486 dollars',
    },
  },
  {
    version: 'v3.0',
    captured: '2025-12-30',
    methodologyUrl:
      'https://web.archive.org/web/20251229181306/https://artificialanalysis.ai/methodology/intelligence-benchmarking',
    indexImage: {
      src: 'images/2025-12-30-artificial-analysis-index.png',
      alt: 'Artificial Analysis Intelligence Index v3.0 bar chart captured 2025-12-30, ranking models by intelligence score with Gemini 3 Pro Preview (high) and GPT-5.2 (xhigh) leading at 73',
    },
    costImage: {
      src: 'images/2025-12-30-artificial-analysis-index-eval-cost-usd.png',
      alt: 'Artificial Analysis bar chart captured 2025-12-30 of the USD cost to run the Intelligence Index per model, with Grok 4 the most expensive at 1888 dollars',
    },
  },
]

/**
 * The index versions with historical chart captures. The Dashboard shows a
 * "predate the current index version" note below the chart when one of these
 * versions is selected, linking here.
 */
export const HISTORICAL_AA_VERSIONS: readonly string[] = HISTORICAL_SNAPSHOTS.map((snapshot) => snapshot.version)

const imageSx = {
  display: 'block',
  width: '100%',
  maxWidth: 1100,
  height: 'auto',
  borderRadius: 1,
} as const

interface HistoricalIntelligenceChartsProps {
  /** Controlled expansion so the chart's predate note can open the section. */
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
}

/**
 * Collapsed-by-default expander holding the captured Artificial Analysis
 * charts of historical Intelligence Index versions (v4.1.1 from 2026-08-11,
 * v4.0.2 from 2026-02-19, v3.0 from 2025-12-30), kept for reference
 * alongside the live version-switched chart above.
 */
export function HistoricalIntelligenceCharts({ expanded, onExpandedChange }: HistoricalIntelligenceChartsProps) {
  return (
    <Box component="section" aria-labelledby="historical-aa-title">
      <Accordion
        disableGutters
        variant="outlined"
        expanded={expanded}
        onChange={(_, next) => onExpandedChange(next)}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="historical-aa-content" id="historical-aa-header">
          <Typography id="historical-aa-title" variant="h6" component="span">
            Historical Artificial Analysis Intelligence charts
          </Typography>
        </AccordionSummary>
        <AccordionDetails id="historical-aa-content">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {HISTORICAL_SNAPSHOTS.map((snapshot) => (
              <Box key={snapshot.version}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Intelligence Index {snapshot.version} charts captured {snapshot.captured} from{' '}
                  <Link href={snapshot.methodologyUrl} target="_blank" rel="noopener noreferrer">
                    Artificial Analysis
                  </Link>
                  . Scores and costs predate the current index version; use the version toggle in the
                  Model Details section for the {snapshot.version} numbers in interactive form.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box
                    component="img"
                    src={snapshot.indexImage.src}
                    alt={snapshot.indexImage.alt}
                    sx={imageSx}
                  />
                  <Box
                    component="img"
                    src={snapshot.costImage.src}
                    alt={snapshot.costImage.alt}
                    sx={imageSx}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}
