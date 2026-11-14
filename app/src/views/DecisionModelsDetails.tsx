import { useMemo } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material'
import { decisionCompanies } from '../models'
import type { DecisionEntry } from '../models'

interface DecisionModelsDetailsProps {
  /** Decision Index rows with company colors already resolved (see App.tsx). */
  entries: readonly DecisionEntry[]
  title?: string
}

/**
 * Collapsed-by-default legend for the Decision Index chart: one row per
 * company with its chart-color swatch and the models it makes, mirroring the
 * color key the Model Details provider buttons give the intelligence chart.
 * The Decision Index has no toggles or table; App.tsx applies the one
 * color rule — a company that is also a known intelligence provider reuses
 * its ai.json color — before the rows reach the chart or this legend, so
 * both read the same entries.
 *
 * Pure presentation: grouping and colors come from the models layer.
 */
export function DecisionModelsDetails({ entries, title = 'Decision Models Details' }: DecisionModelsDetailsProps) {
  const companies = useMemo(() => decisionCompanies(entries), [entries])
  return (
    <Accordion disableGutters variant="outlined">
      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="decision-details-content" id="decision-details-header">
        <Typography variant="h6" component="span">
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails id="decision-details-content">
        <Box component="ul" sx={{ m: 0, px: 2, py: 1, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {companies.map((company) => (
            <Box component="li" key={company.provider} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Box
                component="span"
                aria-hidden
                sx={{ width: 12, height: 12, borderRadius: '3px', flexShrink: 0 }}
                // Inline style, not sx, so the color key survives in the DOM
                // exactly as authored (same pattern as the provider buttons).
                style={{ backgroundColor: company.color }}
              />
              <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>
                {company.provider}
              </Typography>
              <Typography component="span" variant="body2" color="text.secondary">
                {company.models.map(({ model, score }) => `${model} (${score})`).join(', ')}
              </Typography>
            </Box>
          ))}
        </Box>
        <Typography variant="caption" component="p" color="text.secondary" sx={{ px: 2, pb: 1, m: 0, fontStyle: 'italic' }}>
          The company behind each Decision Index model, keyed to its chart bar color. Known Intelligence Index
          providers keep their ai.json color.
        </Typography>
      </AccordionDetails>
    </Accordion>
  )
}
