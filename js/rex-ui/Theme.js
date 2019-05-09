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

type color = string;

export type Theme = {
  accent: {
    success: Accent
  },
  spacing: {
    unit: number
  },
  definitonList: {
    verticalSpacing: number,
    horizontalSpacing: number
  },
  breakpoints: {
    values: {
      xs: number,
      sm: number,
      md: number,
      lg: number,
      xl: number
    }
  },
  palette: {
    type: string,
    common: { black: color, white: color },
    error: Palette,
    success: Palette,
    primary: Palette,
    secondary: Palette,
    action: {
      hoverOpacity: number
    },
    text: {
      primary: color,
      secondary: color,
      disabled: color,
      hint: color
    }
  }
};

type Palette = {
  light: color,
  main: color,
  dark: color,
  contrastText: color
};

type Accent = {
  color: color,
  colorDisabled: color,
  colorHover: color,
  colorBackground: color
};

let defaultTheme: Theme = mui.createMuiTheme({
  typography: {
    useNextVariants: true
  }
});

export let theme: Theme = mui.createMuiTheme({
  typography: {
    useNextVariants: true
  },
  palette: {
    ...defaultTheme.palette,
    success: {
      main: mui.colors.green["600"],
      light: mui.colors.green["200"],
      dark: mui.colors.green["800"]
    }
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 1080,
      lg: 1280,
      xl: 1920
    }
  },
  definitonList: {
    verticalSpacing: 8,
    horizontalSpacing: 8
  }
});

export let useTheme: void => Theme = () => {
  return styles.useTheme() || theme;
}

export let ThemeProvider = ({
  theme: themeCustom,
  children
}: {
  theme?: Theme,
  children: React.Node
}) => {
  if (themeCustom == null) {
    themeCustom = theme;
  }
  return <styles.ThemeProvider theme={themeCustom} children={children} />;
};
