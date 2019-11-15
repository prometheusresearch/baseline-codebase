/**
 * @flow
 */
import { createMuiTheme, type Theme } from "@material-ui/core/styles";
import grey from "@material-ui/core/colors/grey";

export const DEFAULT_THEME = createMuiTheme();

export const DARK_THEME = createMuiTheme({
  palette: {
    primary: {
      main: "rgb(128,128,128)",
      dark: "rgb(66,66,66)",
      contrastText: "white"
    }
  }
});
