import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { SectionMenu } from '../SectionMenu'

describe('SectionMenu', () => {
  it('opens a menu of anchor links to every page section and closes on use', () => {
    render(<SectionMenu />)
    const button = screen.getByRole('button', { name: 'Section menu' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    const menu = screen.getByRole('menu')
    // MUI Menu assigns role="menuitem" to its items (for arrow-key nav) even
    // though they render as <a href="#..."> anchors.
    const links = within(menu).getAllByRole('menuitem')
    expect(links.map((link) => link.textContent)).toEqual([
      'Intelligence chart',
      'Model Details',
      'Hand Picked News',
      'Pareto Frontier',
      'Historical charts',
      'Estimated Hardware',
      'GPU Hardware',
      'Local Hardware',
      'Sources',
    ])
    for (const link of links) {
      expect(link.getAttribute('href')).toMatch(/^#[a-z-]+$/)
    }

    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Pareto Frontier' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
