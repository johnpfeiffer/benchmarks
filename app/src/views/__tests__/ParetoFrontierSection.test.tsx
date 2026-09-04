/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ParetoFrontierSection } from '../ParetoFrontierSection'

describe('Pareto frontier public asset', () => {
  afterEach(() => document.head.querySelector('base')?.remove())

  it.each([
    ['local root', 'http://localhost:5173/'],
    ['deployed app', 'https://feneky.com/benchmarks/'],
  ])('resolves inside the %s base URL', (_name, baseUrl) => {
    const base = document.createElement('base')
    base.href = baseUrl
    document.head.appendChild(base)
    render(<ParetoFrontierSection />)

    const image = screen.getByRole('img', { name: /Intelligence Index versus cost/i }) as HTMLImageElement
    expect(image.src).toBe(`${baseUrl}images/artificial-analysis-pareto-frontier.png`)
  })

  it('ships a real PNG in the public directory', () => {
    const path = resolve('public/images/artificial-analysis-pareto-frontier.png')
    const bytes = readFileSync(path)
    expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  })
})
