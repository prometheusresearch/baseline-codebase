/**
 * Defines theme for RexDB applications.
 *
 * The implementation wraps mui theme mechanism and provides additional RexDB
 * specific variables.
 *
 * @copyright 2019, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import * as styles from "@material-ui/styles";

export type Theme = styles.Theme;

let defaultTheme: Theme = mui.createMuiTheme({
  typography: {
    useNextVariants: true,
  },
});

export let theme: Theme = mui.createMuiTheme({
  typography: {
    useNextVariants: true,
  },
  palette: {
    ...defaultTheme.palette,
    success: {
      main: mui.colors.green["600"],
      light: mui.colors.green["200"],
      dark: mui.colors.green["800"],
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 1080,
      lg: 1280,
      xl: 1920,
    },
  },
  definitonList: {
    verticalSpacing: 8,
    horizontalSpacing: 8,
  },
});

export let useTheme: void => Theme = () => {
  return styles.useTheme() || theme;
};

export function makeStyles<Styles: {}>(
  spec: Theme => Styles,
): any => $ObjMap<Styles, <V>(V) => string> {
  return styles.makeStyles(spec, { defaultTheme: theme });
}

export let ThemeProvider = ({
  theme: themeCustom,
  children,
}: {
  theme?: Theme,
  children: React.Node,
}) => {
  if (themeCustom == null) {
    themeCustom = theme;
  }
  return <styles.ThemeProvider theme={themeCustom} children={children} />;
};
