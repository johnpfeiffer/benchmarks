import { useMemo, useState } from 'react'
import { Box, Chip, FormControlLabel, Switch, TextField, Typography } from '@mui/material'
import { meetsParetoTarget, paretoBounds, paretoFrontier, type ParetoDataset, type ParetoPoint } from '../models/pareto'

const WIDTH = 1100
const HEIGHT = 490
const LEFT = 70
const RIGHT = 30
const TOP = 36
const BOTTOM = 66
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: value < 1 ? 4 : 2 }).format(value)
const palette = ['#278b46', '#cc785c', '#242424', '#1675db', '#7564c4', '#d26813']

/** SVG presentation of a validated, self-contained benchmark snapshot. */
export function ParetoChart({ dataset }: { dataset: ParetoDataset }) {
  const points = dataset.models
  const bounds = useMemo(() => paretoBounds(points), [points])
  const frontier = useMemo(() => paretoFrontier(points), [points])
  const [maxCost, setMaxCost] = useState('1500')
  const [minScore, setMinScore] = useState('45')
  const [labels, setLabels] = useState(points.length <= 20)
  const [active, setActive] = useState<ParetoPoint | null>(null)
  const cost = Number(maxCost)
  const score = Number(minScore)
  const validCost = maxCost.trim() !== '' && Number.isFinite(cost) && cost > 0
  const validScore = minScore.trim() !== '' && Number.isFinite(score) && score >= 0 && score <= 100
  const valid = validCost && validScore
  const plotWidth = WIDTH - LEFT - RIGHT
  const plotHeight = HEIGHT - TOP - BOTTOM
  const logMin = Math.log10(bounds.minCost)
  const logMax = Math.log10(bounds.maxCost)
  const x = (value: number) => LEFT + (Math.log10(value) - logMin) / (logMax - logMin) * plotWidth
  const y = (value: number) => TOP + (bounds.maxScore - value) / (bounds.maxScore - bounds.minScore) * plotHeight
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
  const regionRight = valid ? clamp(x(cost), LEFT, WIDTH - RIGHT) : LEFT
  const regionBottom = valid ? clamp(y(score), TOP, HEIGHT - BOTTOM) : TOP
  const matching = valid ? points.filter(p => meetsParetoTarget(p, cost, score)) : []
  const providers = [...new Set(points.map(p => p.provider))]
  const color = (point: ParetoPoint) => point.color ?? palette[providers.indexOf(point.provider) % palette.length]
  const costTicks = Array.from({ length: Math.ceil(logMax) - Math.floor(logMin) + 1 }, (_, i) =>
    [1, 2, 5].map(multiplier => multiplier * 10 ** (Math.floor(logMin) + i)),
  ).flat().filter(tick => tick >= bounds.minCost && tick <= bounds.maxCost)
  const scoreStep = bounds.maxScore - bounds.minScore <= 50 ? 5 : 10
  const scoreTicks = Array.from({ length: Math.floor((bounds.maxScore - bounds.minScore) / scoreStep) + 1 }, (_, i) => bounds.minScore + scoreStep * i)

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'start', mt: 2, mb: 2 }}>
        <TextField label="Cost below (USD)" type="number" size="small" value={maxCost}
          onChange={e => setMaxCost(e.target.value)} error={!validCost}
          helperText={!validCost ? 'Enter a positive cost.' : 'Total benchmark cost'} />
        <TextField label="Intelligence above" type="number" size="small" value={minScore}
          onChange={e => setMinScore(e.target.value)} error={!validScore}
          helperText={!validScore ? 'Enter a score from 0 to 100.' : 'Strictly greater than this score'} />
        <FormControlLabel control={<Switch checked={labels} onChange={e => setLabels(e.target.checked)} />} label="Show model labels" />
        <Chip label={`${matching.length} of ${points.length} meet your target`} color="success" variant="outlined" aria-live="polite" />
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
        <Typography variant="body2"><Box component="span" sx={{ display: 'inline-block', width: 14, height: 14, bgcolor: '#e1f6e4', border: '1px solid #9acc9f', mr: 0.75 }} />Your target region</Typography>
        <Typography variant="body2">···· Pareto frontier</Typography>
        {providers.map(provider => <Typography variant="body2" key={provider}>
          <Box component="span" sx={{ color: color(points.find(p => p.provider === provider)!), mr: 0.75 }}>●</Box>{provider}
        </Typography>)}
      </Box>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: '100%', minWidth: 720, display: 'block' }}
          role="group" aria-label="Intelligence versus total benchmark cost scatter chart">
          <rect x={LEFT} y={TOP} width={plotWidth} height={plotHeight} fill="#fcfcfc" />
          <rect x={LEFT} y={TOP} width={regionRight - LEFT} height={regionBottom - TOP} fill="#e1f6e4" />
          {scoreTicks.map(tick => <g key={tick}>
            <line x1={LEFT} x2={WIDTH - RIGHT} y1={y(tick)} y2={y(tick)} stroke="#e0e0e0" />
            <text x={LEFT - 10} y={y(tick) + 5} textAnchor="end" fontSize={13} fill="#555">{Number(tick.toFixed(1))}</text>
          </g>)}
          {costTicks.map(tick => <g key={tick}>
            <line x1={x(tick)} x2={x(tick)} y1={TOP} y2={HEIGHT - BOTTOM} stroke="#eaeaea" />
            <text x={x(tick)} y={HEIGHT - BOTTOM + 25} textAnchor="middle" fontSize={13} fill="#555">{money(tick)}</text>
          </g>)}
          {valid && <>
            <line x1={regionRight} x2={regionRight} y1={TOP} y2={HEIGHT - BOTTOM} stroke="#6b9d72" strokeDasharray="5 5" />
            <line x1={LEFT} x2={WIDTH - RIGHT} y1={regionBottom} y2={regionBottom} stroke="#6b9d72" strokeDasharray="5 5" />
          </>}
          <polyline points={frontier.map(p => `${x(p.cost_usd)},${y(p.intelligence)}`).join(' ')} fill="none" stroke="#424242" strokeWidth={2.5} strokeDasharray="1 7" strokeLinecap="round" />
          {points.map(point => <g key={`${point.provider}:${point.model}`}>
            <circle cx={x(point.cost_usd)} cy={y(point.intelligence)} r={active === point ? 9 : 7}
              fill={color(point)} stroke="white" strokeWidth={2} tabIndex={0} role="button"
              aria-label={`${point.model}, ${point.provider}, intelligence ${point.intelligence}, cost ${money(point.cost_usd)}${frontier.includes(point) ? ', Pareto frontier' : ''}`}
              onMouseEnter={() => setActive(point)} onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(point)} onBlur={() => setActive(null)}
              onClick={() => setActive(point)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(point) } }}
              style={{ cursor: 'pointer' }}>
              <title>{`${point.model}\n${point.provider}\nIntelligence: ${point.intelligence}\nCost: ${money(point.cost_usd)}`}</title>
            </circle>
            {labels && <text x={x(point.cost_usd) + (x(point.cost_usd) > WIDTH - 210 ? -12 : 12)} y={y(point.intelligence) - 10}
              textAnchor={x(point.cost_usd) > WIDTH - 210 ? 'end' : 'start'} fontSize={12} fill="#333"
              stroke="white" strokeWidth={3} paintOrder="stroke" pointerEvents="none">{point.model}</text>}
          </g>)}
          <text x={LEFT + plotWidth / 2} y={HEIGHT - 13} textAnchor="middle" fontSize={15}>Total cost to run Intelligence Index (USD, log scale)</text>
          <text transform={`translate(18 ${TOP + plotHeight / 2}) rotate(-90)`} textAnchor="middle" fontSize={15}>Intelligence Index</text>
        </svg>
      </Box>
      <Typography variant="body2" sx={{ minHeight: 28, mt: 1 }} aria-live="polite">
        {active ? `${active.model} · ${active.provider} · Intelligence ${active.intelligence} · ${money(active.cost_usd)}${frontier.includes(active) ? ' · On the Pareto frontier' : ''}` : 'Hover, tap, or focus a point for model details. Lower cost and higher intelligence are better.'}
      </Typography>
      <Typography variant="body2" color="text.secondary">The frontier uses all points in this dataset. Changing your target does not change which models are on the frontier.</Typography>
    </Box>
  )
}
