import { Box, Link, Typography, useTheme } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import type { ModelEntry } from '../models'

interface IntelligenceBarChartProps {
  /** Entries already sorted by the controller (default: score desc). */
  entries: readonly ModelEntry[]
  title?: string
  scoreLabel: string
  fitWidth?: boolean
  /** Show each bar's score above the bar. */
  barValues?: boolean
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
  kimi: '#00B4D8',
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
  barValues = false,
  source,
}: IntelligenceBarChartProps) {
  const theme = useTheme()
  const fallbackColor = theme.palette.grey[500]
  // Fit more bars on screen than the original 52px bands while keeping labels readable.
  const chartWidth = fitWidth ? '100%' : Math.max(920, entries.length * 36)
  const chartHeight = fitWidth ? 380 : 450
  const colorValues = entries.map((entry) => entry.model)
  // Prefer the explicit per-model color from ai.json; fall back to the
  // provider/model-family lookup for SWE-only entries that carry no color.
  const colors = entries.map((entry) => entry.color ?? benchmarkColor(entry, fallbackColor))
  // #AIDEV: Cut empty space at the bottom by starting the y-axis near the lowest score
  const minScore = entries.length > 0 ? Math.min(...entries.map((e) => e.score)) : 0
  const yMin = Math.max(0, Math.floor((minScore - 5) / 5) * 5)

  return (
    <Box>
      {title || source ? (
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
          {title ? (
            <Typography variant="h6" component="h3">
              {title}
            </Typography>
          ) : null}
          {source ? (
            <Link
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              color="text.secondary"
            >
              Source
            </Link>
          ) : null}
        </Box>
      ) : null}
      <Box
        sx={{
          width: '100%',
          position: 'relative',
          borderRadius: 1,
        }}
      >
        <Box
          sx={{
            overflowX: fitWidth ? 'hidden' : 'auto',
            ...(fitWidth
              ? {}
              : {
                  // MUI X v9 hardcodes touch-action: pan-y on its layer
                  // container (zoom support), which blocks horizontal touch
                  // scrolling of this overflow container on mobile. The chart
                  // has no zoom/pan interactions, so restore native panning.
                  // The layer container only carries its emotion-labeled class
                  // (css-*-MuiChartsLayerContainer-root), hence the substring
                  // attribute selector.
                  '& [class*="MuiChartsLayerContainer-root"]': { touchAction: 'pan-x pan-y' },
                }),
          }}
        >
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
                    ...(barValues
                      ? { barLabel: 'value' as const, barLabelPlacement: 'outside' as const }
                      : {}),
                  },
                ]}
                sx={{
                  ...(barValues
                    ? {
                        '& .MuiBarChart-label': {
                          fill: theme.palette.text.secondary,
                          fontSize: 10,
                          fontWeight: 500,
                        },
                      }
                    : {}),
                  '& .MuiChartsGrid-line': {
                    strokeDasharray: '4 4',
                    strokeOpacity: 0.3,
                  },
                }}
                xAxis={[
                  {
                    dataKey: 'model',
                    scaleType: 'band',
                    categoryGapRatio: fitWidth ? 0.78 : 0.4,
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
                    disableTicks: true,
                  },
                ]}
                yAxis={[{ label: scoreLabel, min: yMin, disableTicks: true }]}
                margin={{ left: 60, right: 24, top: 40, bottom: 8 }}
                grid={{ horizontal: true }}
                borderRadius={3}
                hideLegend
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
