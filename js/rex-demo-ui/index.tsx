import * as React from "react";
import * as ReactDOM from "react-dom";
import { Typography, Theme, CssBaseline } from "@material-ui/core";
import { makeStyles, ThemeProvider } from "@material-ui/styles";
import { createMuiTheme } from "@material-ui/core/styles";

let theme = createMuiTheme();

const useStyles = makeStyles((theme: Theme) => {
  return {
    example: {
      margin: "auto",
      maxWidth: 720,
      color: theme.palette.text.primary,
    },
  };
});

export function App() {
  let styles = useStyles();

  return (
    <div className={styles.example}>
      <Typography variant={"h1"} align={"center"}>
        Hello World!
      </Typography>
    </div>
  );
}

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>,
  document.getElementById("root"),
);
