import { useMemo } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { decisionCompanies } from '../models'
import type { DecisionEntry } from '../models'

interface DecisionModelsDetailsProps {
  /** Decision Index rows of the shown version, highest score first. */
  entries: readonly DecisionEntry[]
  title?: string
  /** Index versions present in the data, newest first; the selector renders only when there is more than one. */
  aaVersions?: readonly string[]
  /** The index version currently shown. */
  aaVersion?: string
  /** Called when the summary's version selector is used. */
  onAAVersionChange?: (version: string) => void
}

/**
 * Collapsed-by-default legend for the Decision Index chart: one row per
 * company with its chart-color swatch and the models it makes, mirroring the
 * color key the Model Details provider buttons give the intelligence chart.
 * The Decision Index has no model-selection toggles or table; the legend
 * and the chart read the same decision.json rows, so a company's swatch
 * always matches its bars. When more than one index version exists, the
 * summary carries a version selector (same ToggleButtonGroup pattern as
 * Model Details: clicks do not toggle the accordion) that switches the
 * chart and this legend together.
 *
 * Pure presentation: grouping and colors come from the models layer.
 */
export function DecisionModelsDetails({ entries, title = 'Decision Models Details', aaVersions, aaVersion, onAAVersionChange }: DecisionModelsDetailsProps) {
  const companies = useMemo(() => decisionCompanies(entries), [entries])
  return (
    <Accordion disableGutters variant="outlined">
      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="decision-details-content" id="decision-details-header">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6" component="span">
            {title}
          </Typography>
          {aaVersions && aaVersions.length > 1 && aaVersion && onAAVersionChange && (
            // Same ToggleButtonGroup as Model Details' version selector;
            // clicks stay local so the accordion does not toggle.
            <ToggleButtonGroup
              size="small"
              exclusive
              value={aaVersion}
              onClick={(e) => e.stopPropagation()}
              onChange={(_, next) => {
                // MUI emits null when the selected button is clicked again.
                if (next !== null) onAAVersionChange(next)
              }}
              aria-label="Decision Index version"
            >
              {aaVersions.map((version) => (
                <ToggleButton key={version} value={version}>
                  {version}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}
        </Box>
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
          The company behind each Decision Index model, keyed to its chart bar color (colors from decision.json;
          known Intelligence Index providers share their ai.json color).
        </Typography>
      </AccordionDetails>
    </Accordion>
  )
}
