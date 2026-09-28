/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ParetoFrontierSection } from '../ParetoFrontierSection'
import type { ParetoDataset } from '../../models/pareto'

const publishedV43: ParetoDataset = {
  benchmark_version: 'Artificial Analysis Intelligence Index v4.3',
  date: '2026-09-13',
  sample: false,
  models: [
    { model: 'Alpha', provider: 'A', intelligence: 50, cost_usd: 300 },
    { model: 'Beta', provider: 'B', intelligence: 60, cost_usd: 900 },
  ],
}

const publishedV42: ParetoDataset = {
  benchmark_version: 'Artificial Analysis Intelligence Index v4.2',
  date: '2026-09-04',
  sample: false,
  models: [
    { model: 'Alpha', provider: 'A', intelligence: 45, cost_usd: 250 },
    { model: 'Beta', provider: 'B', intelligence: 55, cost_usd: 800 },
  ],
}

/** The section is collapsed by default; open it to mount the chart. */
function expandSection() {
  fireEvent.click(screen.getByRole('button', { name: 'Pareto Frontier' }))
  return screen.getByRole('heading', { name: 'Pareto Frontier' }).closest('section') as HTMLElement
}

describe('Pareto frontier public asset', () => {
  afterEach(() => document.head.querySelector('base')?.remove())

  it.each([
    ['local root', 'http://localhost:5173/'],
    ['deployed app', 'https://feneky.com/benchmarks/'],
  ])('resolves inside the %s base URL', (_name, baseUrl) => {
    const base = document.createElement('base')
    base.href = baseUrl
    document.head.appendChild(base)
    render(<ParetoFrontierSection publishedDataset={publishedV43} />)

    // The section is collapsed by default; open it to mount the reference image.
    fireEvent.click(screen.getByRole('button', { name: 'Pareto Frontier' }))
    const image = screen.getByRole('img', { name: /Intelligence Index versus cost/i }) as HTMLImageElement
    expect(image.src).toBe(`${baseUrl}images/artificial-analysis-pareto-frontier.png`)
  })

  it('ships a real PNG in the public directory', () => {
    const path = resolve('public/images/artificial-analysis-pareto-frontier.png')
    const bytes = readFileSync(path)
    expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  })
})

describe('Pareto frontier published snapshot', () => {
  it('labels the chart with the published version and snapshot date', () => {
    render(<ParetoFrontierSection publishedDataset={publishedV43} />)
    const section = expandSection()
    expect(within(section).getByText(/Intelligence Index v4\.3 · Snapshot 2026-09-13/)).toBeInTheDocument()
  })

  it('follows the published snapshot when the selected version changes', () => {
    const { rerender } = render(<ParetoFrontierSection publishedDataset={publishedV43} />)
    const section = expandSection()
    rerender(<ParetoFrontierSection publishedDataset={publishedV42} />)
    expect(within(section).getByText(/Intelligence Index v4\.2 · Snapshot 2026-09-04/)).toBeInTheDocument()
    expect(within(section).queryByText(/Snapshot 2026-09-13/)).not.toBeInTheDocument()
  })

  it('shows a notice instead of a chart for a version with no costed rows', () => {
    render(<ParetoFrontierSection publishedDataset={{ ...publishedV42, models: [] }} />)
    const section = expandSection()
    expect(within(section).getByText(/No total eval costs are published/)).toBeInTheDocument()
    expect(within(section).queryByText(/Snapshot 2026-09-04/)).not.toBeInTheDocument()
  })

  it('keeps pasted data across a version switch until reload restores the selected version', () => {
    const { rerender } = render(<ParetoFrontierSection publishedDataset={publishedV43} />)
    const section = expandSection()
    const pasted = JSON.stringify({
      benchmark_version: 'Pasted benchmark v9',
      date: '2026-09-20',
      sample: true,
      models: [{ model: 'M', provider: 'P', intelligence: 10, cost_usd: 100 }],
    })
    fireEvent.change(within(section).getByLabelText('Chart JSON'), { target: { value: pasted } })
    fireEvent.click(within(section).getByRole('button', { name: 'Apply JSON' }))
    expect(within(section).getByText(/Pasted benchmark v9 · Snapshot 2026-09-20/)).toBeInTheDocument()

    // A version switch does not discard the pasted preview.
    rerender(<ParetoFrontierSection publishedDataset={publishedV42} />)
    expect(within(section).getByText(/Pasted benchmark v9 · Snapshot 2026-09-20/)).toBeInTheDocument()

    // Reload restores the currently selected version's published snapshot.
    fireEvent.click(within(section).getByRole('button', { name: 'Reload published data' }))
    expect(within(section).getByText(/Intelligence Index v4\.2 · Snapshot 2026-09-04/)).toBeInTheDocument()
  })
})
