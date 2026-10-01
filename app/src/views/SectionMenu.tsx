import { useState } from 'react'
import MenuIcon from '@mui/icons-material/Menu'
import { IconButton, Menu, MenuItem, Paper } from '@mui/material'

/**
 * The page's sections in document order, each anchored to the id that section
 * already carries in Dashboard. Keep in sync with Dashboard's layout; the
 * acceptance suite asserts every target id exists in the rendered page.
 */
const SECTIONS = [
  { label: 'Intelligence chart', href: '#intelligence-title' },
  { label: 'Model Details', href: '#details-header' },
  { label: 'Hand Picked News', href: '#news-title' },
  { label: 'Pareto Frontier', href: '#pareto-title' },
  { label: 'Historical charts', href: '#historical-aa-title' },
  { label: 'Estimated Hardware', href: '#hardware-title' },
  { label: 'GPU Hardware', href: '#gpu-title' },
  { label: 'Local Hardware', href: '#local-hw-title' },
  { label: 'Sources', href: '#sources-footer' },
] as const

/**
 * Hamburger-style section menu pinned to the top-right corner: the page is
 * long and otherwise has no navigation. Each entry is a plain anchor link to
 * the section's id (the same pattern as the chart's predate note), so no
 * client-side scrolling logic is needed.
 */
export function SectionMenu() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const open = anchor !== null
  return (
    <>
      <Paper
        elevation={3}
        sx={{ position: 'fixed', top: 8, right: 8, zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <IconButton
          aria-label="Section menu"
          aria-controls={open ? 'section-menu' : undefined}
          aria-expanded={open}
          aria-haspopup="true"
          onClick={(event) => setAnchor(event.currentTarget)}
          size="small"
        >
          <MenuIcon />
        </IconButton>
      </Paper>
      <Menu
        id="section-menu"
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {SECTIONS.map((section) => (
          <MenuItem key={section.href} component="a" href={section.href} onClick={() => setAnchor(null)}>
            {section.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
