import { Box, Chip, Typography, useTheme } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import type { ModelEntry } from '../models'

interface IntelligenceBarChartProps {
  /** Entries already sorted by the controller (default: score desc). */
  entries: readonly ModelEntry[]
  title?: string
  scoreLabel: string
  fitWidth?: boolean
  source?: {
    label: string
    href: string
  }
}

const PROVIDER_COLORS = {
  anthropic: '#cc785c',
  openai: '#1f1f1f',
  grok: '#736cd3',
  'z ai': '#1c7ff8',
  google: '#34A853',
  deepseek: '#2243e6',
  kimi: '#047AFE',
  nvidia: '#86b737',
  qwen: '#F54F35',
  cerebras: '#F15929',
} as const

function benchmarkColor(entry: ModelEntry, fallback: string): string {
  const provider = entry.provider.toLowerCase()
  const model = entry.model.toLowerCase()
  if (provider.includes('anthropic') || model.startsWith('claude')) return PROVIDER_COLORS.anthropic
  if (provider.includes('openai') || model.startsWith('gpt')) return PROVIDER_COLORS.openai
  if (provider.includes('xai') || model.startsWith('grok')) return PROVIDER_COLORS.grok
  if (provider.includes('z ai') || model.startsWith('glm')) return PROVIDER_COLORS['z ai']
  if (provider.includes('google') || model.startsWith('gemini') || model.startsWith('gemma')) return PROVIDER_COLORS.google
  if (provider.includes('deepseek') || model.startsWith('deepseek')) return PROVIDER_COLORS.deepseek
  if (provider.includes('moonshot') || model.startsWith('kimi')) return PROVIDER_COLORS.kimi
  if (provider.includes('nvidia') || model.startsWith('nemotron')) return PROVIDER_COLORS.nvidia
  if (provider.includes('alibaba') || model.startsWith('qwen')) return PROVIDER_COLORS.qwen
  if (provider.includes('cerebras')) return PROVIDER_COLORS.cerebras
  return fallback
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
export function IntelligenceBarChart({
  entries,
  title,
  scoreLabel,
  fitWidth = false,
  source,
}: IntelligenceBarChartProps) {
  const theme = useTheme()
  const fallbackColor = theme.palette.grey[500]
  // Fit more bars on screen than the original 52px bands while keeping labels readable.
  const chartWidth = fitWidth ? '100%' : Math.max(920, entries.length * 36)
  const chartHeight = fitWidth ? 380 : 420
  const colorValues = entries.map((entry) => entry.model)
  // Prefer the explicit per-model color from ai.json; fall back to the
  // provider/model-family lookup for SWE-only entries that carry no color.
  const colors = entries.map((entry) => entry.color ?? benchmarkColor(entry, fallbackColor))

  return (
    <Box>
      {title ? (
        <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
          {title}
        </Typography>
      ) : null}
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
        <Box sx={{ overflowX: fitWidth ? 'hidden' : 'auto' }}>
          {entries.length === 0 ? (
            <Box sx={{ minHeight: 240, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">No models selected</Typography>
            </Box>
          ) : (
            <Box sx={{ width: chartWidth, height: chartHeight }}>
              <BarChart
                dataset={entries as unknown as readonly Record<string, unknown>[]}
                series={[
                  {
                    dataKey: 'score',
                    label: scoreLabel,
                  },
                ]}
                xAxis={[
                  {
                    dataKey: 'model',
                    scaleType: 'band',
                    label: 'Model',
                    categoryGapRatio: fitWidth ? 0.78 : 0.55,
                    colorMap: {
                      type: 'ordinal',
                      values: colorValues,
                      colors,
                      unknownColor: fallbackColor,
                    },
                    tickLabelStyle: { angle: -35, fontSize: 11, textAnchor: 'end' },
                    tickLabelInterval: () => true,
                    tickLabelMinGap: 0,
                    tickLabelPlacement: 'middle',
                    height: 110,
                  },
                ]}
                yAxis={[{ label: scoreLabel }]}
                margin={{ left: 60, right: 24, top: source ? 48 : 24, bottom: 8 }}
                grid={{ horizontal: true }}
                borderRadius={2}
                hideLegend
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
