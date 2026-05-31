import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? '#6366f1' : '#4f46e5', // indigo
      light: '#818cf8',
      dark: '#3730a3',
    },
    secondary: {
      main: mode === 'dark' ? '#f43f5e' : '#e11d48', // rose
    },
    background: {
      default: mode === 'dark' ? '#0b0f19' : '#f8fafc',
      paper: mode === 'dark' ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    },
    text: {
      primary: mode === 'dark' ? '#f1f5f9' : '#0f172a',
      secondary: mode === 'dark' ? '#94a3b8' : '#475569',
    },
    status: {
      available: '#10b981', // emerald
      occupied: '#4f46e5',  // indigo
      reserved: '#f59e0b',  // amber
      maintenance: '#ef4444', // red
      cleaning: '#d97706',    // orange-dark
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.025em' },
    h2: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.015em' },
    h4: { fontSize: '1.25rem', fontWeight: 600 },
    body1: { fontSize: '1rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: mode === 'dark'
            ? '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            : '0 8px 32px 0 rgba(31, 38, 135, 0.04)',
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(12px)',
          backgroundColor: mode === 'dark' ? 'rgba(11, 15, 25, 0.7)' : 'rgba(248, 250, 252, 0.7)',
          borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
          color: mode === 'dark' ? '#f1f5f9' : '#0f172a',
          boxShadow: 'none',
        },
      },
    },
  },
});

export const getTheme = (mode) => createTheme(getDesignTokens(mode));
