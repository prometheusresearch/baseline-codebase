// @flow

import * as React from "react";
import { BrowserRouter } from "react-router-dom";
import * as mui from "@material-ui/core";
import * as Rapid from "../rapid";

import { urlFor } from "rex-ui/app";
import { Router, type Route } from "./Route";

type Props = {|
  basename: string,
  title: string,
  routes: Route[],
|};

export default function App({ basename: basenamespec, routes }: Props) {
  let basename = React.useMemo(() => {
    let uri = urlFor(basenamespec);
    return uri.slice(window.location.origin.length);
  }, [basenamespec]);

  let [theme, _setTheme] = React.useState<"default" | "custom">("default");
  let themeConfig: Rapid.Theme = React.useMemo(() => {
    switch (theme) {
      case "custom": {
        return Rapid.DARK_THEME;
      }
      case "default":
      default: {
        return Rapid.DEFAULT_THEME;
      }
    }
  }, [theme]);

  return (
    <BrowserRouter basename={basename}>
      <Rapid.ThemeProvider theme={themeConfig}>
        <mui.MuiThemeProvider theme={themeConfig}>
          <Router routes={routes} />
        </mui.MuiThemeProvider>
      </Rapid.ThemeProvider>
    </BrowserRouter>
  );
}
