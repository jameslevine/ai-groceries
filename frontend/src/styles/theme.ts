import { createTheme } from '@mui/material/styles';

const lightPalette = {
  primary: {
    main: '#2E7D32',
    light: '#4CAF50',
    dark: '#1B5E20',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#FF6F00',
    light: '#FFA726',
    dark: '#E65100',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F5F5F5',
    paper: '#FFFFFF',
  },
  success: {
    main: '#43A047',
  },
  warning: {
    main: '#FFA000',
  },
  error: {
    main: '#D32F2F',
  },
  info: {
    main: '#1976D2',
  },
};

const darkPalette = {
  primary: {
    main: '#66BB6A',
    light: '#81C784',
    dark: '#388E3C',
    contrastText: '#000000',
  },
  secondary: {
    main: '#FFB74D',
    light: '#FFCC80',
    dark: '#F57C00',
    contrastText: '#000000',
  },
  background: {
    default: '#121212',
    paper: '#1E1E1E',
  },
};

export const createAppTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'light' ? lightPalette : darkPalette),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 8,
            padding: '8px 20px',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small',
        },
      },
    },
  });
