import { Box, Link, Typography } from '@mui/material'
import { SiteFooter } from 'johnutilsjs/ui'
import type { DataSourceCredit } from './Dashboard'

interface FooterProps {
  sources: readonly DataSourceCredit[]
}

/**
 * Footer crediting the data source, composed with the shared SiteFooter
 * (johnutilsjs/ui) which adds the built-by line and the source-code link.
 *
 * Requirements (requirements-v1.md): give credit to each benchmark source.
 */
export function Footer({ sources }: FooterProps) {
  return (
    <SiteFooter repo="benchmarks">
      <Box
        // The section menu's "Sources" entry anchors here.
        id="sources-footer"
        sx={{ mt: 2 }}
      >
        <Typography variant="body2" color="text.secondary">
          Data sources:{' '}
          {sources.map((source, index) => (
            <span key={source.href}>
              {index > 0 ? ', ' : ''}
              <Link href={source.href} target="_blank" rel="noopener noreferrer">
                {source.label}
              </Link>
            </span>
          ))}
        </Typography>
      </Box>
    </SiteFooter>
  )
}
