/**
 * @flow
 */
import {
  type Theme as ThemeBase,
  type color,
  makeStyles as makeStylesBase,
  ThemeProvider as ThemeProviderBase,
} from "@material-ui/styles";
import { createMuiTheme } from "@material-ui/core/styles";
import brown from "@material-ui/core/colors/brown";
import deepPurple from "@material-ui/core/colors/deepPurple";
import blue from "@material-ui/core/colors/blue";
import green from "@material-ui/core/colors/green";
import red from "@material-ui/core/colors/red";
import yellow from "@material-ui/core/colors/yellow";

export type Theme = {
  ...ThemeBase,
  status: $Shape<{
    successText: color,
    successBackground: color,
    errorText: color,
    errorBackground: color,
    inProgressText: color,
    inProgressBackground: color,
    warningText: color,
    warningBackground: color,
  }>,
};

export let makeStyles: <Styles: {}>(
  styles: (Theme) => Styles,
  params: Object,
) => any => $ObjMap<Styles, <V>(V) => string> = (makeStylesBase: any);

export let ThemeProvider: React.AbstractComponent<{|
  children: Node,
  theme: Theme,
|}> = (ThemeProviderBase: any);

export const DEFAULT_THEME: Theme = {
  ...createMuiTheme({
    palette: {
      secondary: deepPurple,
    },
  }),

  status: {
    successText: green[500],
    successBackground: green[50],
    errorText: red[500],
    errorBackground: red[50],
    inProgressText: blue[500],
    inProgressBackground: blue[50],
    warningText: yellow[800],
    warningBackground: yellow[50],
  },
};

export const DARK_THEME: Theme = {
  ...createMuiTheme({
    palette: {
      primary: {
        main: "rgb(128,128,128)",
        dark: "rgb(66,66,66)",
        contrastText: "white",
      },
      secondary: brown,
    },
  }),
  status: {
    successBackground: green[500],
    errorBackground: red[500],
    inProgressBackground: blue[500],
    warningBackground: yellow[500],
  },
};
