import { amber, green, grey, red, teal } from '@material-ui/core/colors';
import { createTheme } from '@material-ui/core/styles';
import type { IConfigStore } from 'types/store';

const commonOptions = {
  mixins: {
    drawer: {
      width: 220,
      miniWidth: 76,
    },
  },
  typography: {
    htmlFontSize: 20,
    h6: {
      fontSize: '1rem',
    },
  },
  overrides: {
    MuiTooltip: {
      tooltip: {
        fontSize: '0.8rem',
      },
    },
    MuiListItemIcon: {
      root: {
        minWidth: 42,
      },
    },
  },
};

const darkBlue= 
{
  50: '#e8eaf9',
  100: '#c4c9f1',
  200: '#9ca6e7',
  300: '#7283de',
  400: '#5067d7',
  500: '#284cce',
  600: '#2244c4',
  700: '#1439b8',
  800: '#012eac',
  900: '#001a99',
  A100: '#8c9eff',
  A200: '#536dfe',
  A400: '#3d5afe',
  A700: '#304ffe'
};

const seriesColor = [
  darkBlue[500],
  amber[500],
  '#f44336',
  '#03a9f4',
  '#4caf50',
  '#ffeb3b',
  '#ff5722',
  '#607d8b',
  '#ff7300',
  '#e81e63',
  '#3f51b5',
  '#00bcd4',
  '#8bc34a',
  '#ffc107',
  '#795548',
  '#8884d8',
  teal[400],
  '#9c27b0',
  '#2196f3',
  '#009688',
  '#cddc39',
  '#ff9800',
  '#9e9e9e',
  '#82ca9d',
  '#f50057',
];


const lightTheme = createTheme({
  name: 'Light Theme',
  palette: {
    type: 'light',
    primary: darkBlue,
    background: {
      nested: '#fff',
      paper: '#fff',
      default: grey[100],
      error: red.A100,
    },
    graphs: {
      grid: grey[300],
      axis: grey[700],
      tooltip: grey[50],
      series: seriesColor,
    },
    notifications: {
      info: grey[900],
      success: green[600],
      warning: amber[500],
      error: red[500],
    },
  },
  ...commonOptions,
});

const darkTheme = createTheme({
  name: 'Dark Theme',
  palette: {
    type: 'dark',
    primary: amber,
    secondary: {
      main: red[500],
    },
    background: {
      nested: grey[800],
      paper: '#333',
      default: grey[900],
      error: red.A100,
    },
    graphs: {
      grid: grey[700],
      axis: grey[400],
      tooltip: grey[900],
      series: seriesColor,
    },
    notifications: {
      info: grey[100],
      success: green[600],
      warning: amber[500],
      error: red[800],
    },
  },
  ...commonOptions,
});

const getTheme = (config: IConfigStore) => (config.darkMode ? darkTheme : lightTheme);

export { lightTheme, darkTheme, getTheme as default };
