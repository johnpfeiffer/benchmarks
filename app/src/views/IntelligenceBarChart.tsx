import { Box, Typography, useTheme } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import type { ModelEntry } from '../models'

interface IntelligenceBarChartProps {
  /** Entries already sorted by the controller (default: score desc). */
  entries: readonly ModelEntry[]
}

/**
 * Vertical bar chart of intelligence scores.
 *
 * Pure presentation: it only renders what it is given. The controller is
 * responsible for sorting (default highest on the left, lowest on the right).
 *
 * With many models the chart is given a generous minimum width and placed in a
 * horizontally scrollable container so labels stay readable (per DESIGN.md:
 * provide an obvious way to continue).
 */
export function IntelligenceBarChart({ entries }: IntelligenceBarChartProps) {
  const theme = useTheme()
  // Enough room per bar so band labels stay legible.
  const minWidth = Math.max(720, entries.length * 52)

  return (
    <Box>
      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
        Intelligence Score
      </Typography>
      <Box
        sx={{
          width: '100%',
          overflowX: 'auto',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        <Box sx={{ width: minWidth, height: 420 }}>
          <BarChart
            dataset={entries as unknown as readonly Record<string, unknown>[]}
            series={[
              {
                dataKey: 'score',
                label: 'Intelligence Score',
                color: theme.palette.primary.main,
              },
            ]}
            xAxis={[
              {
                dataKey: 'model',
                scaleType: 'band',
                label: 'Model',
                tickLabelStyle: { fontSize: 11 },
                tickLabelPlacement: 'middle',
              },
            ]}
            yAxis={[{ label: 'Score' }]}
            margin={{ left: 60, right: 24, top: 24, bottom: 70 }}
            grid={{ horizontal: true }}
            borderRadius={2}
          />
        </Box>
      </Box>
    </Box>
  )
}
