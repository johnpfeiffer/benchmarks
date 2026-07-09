import { createTheme } from '@mui/material/styles'

/**
 * Minimalist light-mode theme.
 *
 * Per /KERNEL/DESIGN.md: use MUI defaults, only specify overrides. Light mode,
 * plain aesthetic, at least 14px font, 1px borders so items do not run together.
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
  },
  typography: {
    // MUI's default is already 14px; stated explicitly to honor the floor.
    fontSize: 14,
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: '1px solid', borderColor: 'divider' },
      },
    },
  },
})
