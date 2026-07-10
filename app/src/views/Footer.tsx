import { Box, Link, Typography } from '@mui/material'
import type { DataSourceCredit } from './Dashboard'

interface FooterProps {
  sources: readonly DataSourceCredit[]
}

/**
 * Footer crediting the data source.
 *
 * Requirements (requirements-v1.md): give credit to each benchmark source.
 */
export function Footer({ sources }: FooterProps) {
  return (
    <Box
      component="footer"
      sx={{
        mt: 4,
        py: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
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
  )
}
