import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ParetoChart } from '../ParetoChart'
import { ParetoFrontierSection } from '../ParetoFrontierSection'
import type { ParetoDataset } from '../../models/pareto'

const dataset: ParetoDataset = {
  benchmark_version: 'Example version', date: '2026-09-06', sample: true,
  models: [
    { model: 'Efficient', provider: 'A', intelligence: 50, cost_usd: 300 },
    { model: 'Powerful', provider: 'B', intelligence: 60, cost_usd: 2000 },
  ],
}

it('updates targets without changing the frontier and exposes point details to keyboard users', () => {
  render(<ParetoChart dataset={dataset} />)
  expect(screen.getByText('1 of 2 meet your target')).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Cost below (USD)'), { target: { value: '3000' } })
  expect(screen.getByText('2 of 2 meet your target')).toBeInTheDocument()
  const efficient = screen.getByRole('button', { name: /Efficient, A, intelligence 50.*Pareto frontier/ })
  fireEvent.focus(efficient)
  expect(screen.getByText(/Efficient · A · Intelligence 50/)).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Intelligence above'), { target: { value: '60' } })
  expect(screen.getByText('0 of 2 meet your target')).toBeInTheDocument()
  expect(efficient).toHaveAttribute('aria-label', expect.stringContaining('Pareto frontier'))
  fireEvent.change(screen.getByLabelText('Cost below (USD)'), { target: { value: '' } })
  expect(screen.getByText('Enter a positive cost.')).toBeInTheDocument()
})

describe('Pareto dataset loading', () => {
  it('loads bundled JSON, labels sample data, and rejects invalid imports without losing the chart', async () => {
    render(<ParetoFrontierSection />)
    await screen.findByText(/Sample data — fictional models/)
    expect(screen.getByText(/Illustrative sample — not benchmark measurements/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Load chart data'))
    fireEvent.change(screen.getByLabelText('Chart JSON'), { target: { value: '{"models": []}' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply JSON' }))
    expect(screen.getByRole('alert')).toHaveTextContent('benchmark_version is required.')
    expect(screen.getByRole('button', { name: /Example Mini, Example Labs A/ })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Chart JSON'), { target: { value: JSON.stringify({ ...dataset, sample: false, benchmark_version: 'Imported version' }) } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply JSON' }))
    expect(screen.queryByText(/Sample data — fictional models/)).not.toBeInTheDocument()
    expect(screen.getByText(/Imported version · Snapshot/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reload published data' }))
    expect(screen.getByText(/Illustrative sample — not benchmark measurements/)).toBeInTheDocument()
  })
})
