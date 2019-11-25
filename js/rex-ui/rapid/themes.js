/**
 * @flow
 */
import { createMuiTheme, type Theme } from "@material-ui/core/styles";
import brown from "@material-ui/core/colors/brown";
import deepPurple from "@material-ui/core/colors/deepPurple";

export const DEFAULT_THEME = createMuiTheme({
  palette: {
    secondary: deepPurple,
  },
});

export const DARK_THEME = createMuiTheme({
  palette: {
    primary: {
      main: "rgb(128,128,128)",
      dark: "rgb(66,66,66)",
      contrastText: "white",
    },
    secondary: brown,
  },
});
