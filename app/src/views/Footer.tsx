import { Box, Link, SvgIcon, Typography } from '@mui/material'
import type { DataSourceCredit } from './Dashboard'

interface FooterProps {
  sources: readonly DataSourceCredit[]
}

function GitHubMark() {
  return (
    <SvgIcon aria-hidden="true" focusable="false" fontSize="small" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.52 2.87 8.36 6.84 9.72.5.1.68-.22.68-.49 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.22-3.37-1.22-.45-1.19-1.11-1.51-1.11-1.51-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.34 9.34 0 0 1 12 6.94c.85 0 1.7.12 2.5.36 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.49A10.07 10.07 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </SvgIcon>
  )
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
      <Link
        href="https://github.com/johnpfeiffer/benchmarks"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub repository"
        sx={{
          mt: 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          color: 'text.secondary',
        }}
      >
        <GitHubMark />
        GitHub
      </Link>
    </Box>
  )
}
