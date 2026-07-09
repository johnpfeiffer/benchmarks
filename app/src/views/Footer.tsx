import { Box, Link, Typography } from '@mui/material'

/**
 * Footer crediting the data source.
 *
 * Requirements (requirements-v1.md): give credit to artificialanalysis.ai.
 */
export function Footer() {
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
        Data source:{' '}
        <Link href="https://artificialanalysis.ai/" target="_blank" rel="noopener noreferrer">
          Artificial Analysis
        </Link>
      </Typography>
    </Box>
  )
}
