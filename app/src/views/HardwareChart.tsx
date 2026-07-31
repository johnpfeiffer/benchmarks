import { Box, Chip } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import type { HardwareEntry } from '../models'

interface HardwareChartProps {
  entries: readonly HardwareEntry[]
  source?: { label: string; href: string }
}

/**
 * Grouped bar chart comparing 1-bit and 2-bit dynamic quant
 * (UD-IQ1_S, UD-IQ1_M, UD-IQ2_XXS, UD-IQ2_M) estimated hardware sizes
 * across models.
 *
 * Pure presentation: renders the given entries. Models with null quant values
 * are included on the x-axis but their bars are omitted by the chart engine.
 */
export function HardwareChart({ entries, source }: HardwareChartProps) {
  return (
    <Box>
      <Box
        sx={{
          width: '100%',
          position: 'relative',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        {source ? (
          <Chip
            component="a"
            clickable
            href={source.href}
            target="_blank"
            rel="noopener noreferrer"
            label={`Source: ${source.label}`}
            size="small"
            variant="outlined"
            sx={{ position: 'absolute', zIndex: 1, top: 8, right: 8, bgcolor: 'background.paper' }}
          />
        ) : null}
        <Box sx={{ width: '100%', height: 380 }}>
          <BarChart
            dataset={entries as unknown as readonly Record<string, unknown>[]}
            series={[
              { dataKey: 'iq1_s_gb', label: 'UD-IQ1_S', color: '#1976d2' },
              { dataKey: 'iq1_m_gb', label: 'UD-IQ1_M', color: '#64b5f6' },
              { dataKey: 'iq2_xxs_gb', label: 'UD-IQ2_XXS', color: '#388e3c' },
              { dataKey: 'iq2_m_gb', label: 'UD-IQ2_M', color: '#81c784' },
            ]}
            xAxis={[
              {
                dataKey: 'model',
                scaleType: 'band',
                label: 'Model',
                categoryGapRatio: 0.5,
                tickLabelStyle: { angle: -35, fontSize: 11, textAnchor: 'end' },
                tickLabelInterval: () => true,
                tickLabelMinGap: 0,
                tickLabelPlacement: 'middle',
                height: 110,
              },
            ]}
            yAxis={[{ label: 'Size (GB)' }]}
            margin={{ left: 60, right: 24, top: source ? 48 : 24, bottom: 8 }}
            grid={{ horizontal: true }}
            borderRadius={2}
          />
        </Box>
      </Box>
    </Box>
  )
}
