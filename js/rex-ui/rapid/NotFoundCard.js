// @flow

import * as React from "react";

import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";

import { makeStyles } from "../Theme.js";

type NotFoundCardProps = {|
  text?: string,
  flat?: boolean,
  square?: boolean,
|};

export function NotFoundCard({ text, flat, square }: NotFoundCardProps) {
  let classes = useStyles();

  return (
    <Grid>
      <Grid item xs={12}>
        <Paper
          elevation={flat ? 0 : null}
          square={square}
          className={classes.root}
        >
          <Card raised={false}>
            <CardContent>
              <Typography variant="h6" gutterBottom className={classes.title}>
                {text || "Not found"}
              </Typography>
            </CardContent>
          </Card>
        </Paper>
      </Grid>
    </Grid>
  );
}

let useStyles = makeStyles(theme => ({
  root: {
    width: "100%",
    overflowX: "auto",
  },
  content: {
    display: "flex",
    flexDirection: "column",
  },
  title: {
    textAlign: "center",
    marginBottom: theme.spacing(2),
    fontSize: 16,
  },
}));
