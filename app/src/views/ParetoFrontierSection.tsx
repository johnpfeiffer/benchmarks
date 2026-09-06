import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useState } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Link, TextField, Typography } from '@mui/material'
import { useParetoDataset } from '../controllers/useParetoDataset'
import paretoDatasetUrl from '../data/pareto.json?url'
import { ParetoChart } from './ParetoChart'
// Public asset, relative to the host-injected <base href="/benchmarks/">.
// A leading slash would bypass that base and request the wrong app's root.
const paretoFrontierUrl = 'images/artificial-analysis-pareto-frontier.png'

/**
 * Interactive comparison with an optional historical reference image.
 * Data loading and validation are handled by the controller/domain layers.
 */
export function ParetoFrontierSection() {
  const { dataset, loading, error, importJson, reload } = useParetoDataset()
  const [json, setJson] = useState('')
  return (
    <Box component="section" aria-labelledby="pareto-title">
      <Accordion defaultExpanded disableGutters variant="outlined">
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="pareto-content" id="pareto-header">
          <Typography id="pareto-title" variant="h6" component="span">
            Pareto frontier
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Typography variant="body2" color="text.secondary">
            Compare intelligence with total benchmark cost. Set your targets to highlight high-intelligence, low-cost models.
          </Typography>
          {loading && <Typography role="status" sx={{ my: 2 }}>Loading chart data…</Typography>}
          {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
          {dataset && <>
            {dataset.sample && <Alert severity="info" role="status" sx={{ mt: 2 }}>Sample data — fictional models and values for demonstrating the chart. These are not Artificial Analysis results.</Alert>}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{dataset.benchmark_version} · Snapshot {dataset.date}</Typography>
            <ParetoChart key={`${dataset.date}:${dataset.benchmark_version}:${JSON.stringify(dataset.models)}`} dataset={dataset} />
          </>}
          <Box component="details" sx={{ mt: 2, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Box component="summary" sx={{ cursor: 'pointer' }}>Load chart data</Box>
            <Typography variant="body2" sx={{ my: 1 }}>
              Paste a JSON snapshot with benchmark_version, date, sample, and models. Each model needs model (including effort), provider, intelligence, and cost_usd. Cost is the total benchmark run cost, not token pricing.
            </Typography>
            <Link href={paretoDatasetUrl} download>Download current JSON / format example</Link>
            <TextField label="Chart JSON" multiline minRows={4} maxRows={12} fullWidth value={json}
              onChange={event => setJson(event.target.value)} sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" disabled={loading || !json.trim()} onClick={() => importJson(json)}>Apply JSON</Button>
              <Button disabled={loading} onClick={reload}>Reload published data</Button>
            </Box>
            <Typography variant="caption" component="p" sx={{ mt: 1 }}>Pasted data is a temporary preview, cleared on page refresh. Reload published data to restore the saved snapshot.</Typography>
          </Box>
          <Box component="details" open={dataset ? undefined : true} sx={{ mt: 2 }}>
          <Box component="summary" sx={{ cursor: 'pointer', mb: 1 }}>Historical reference image</Box>
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
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}
