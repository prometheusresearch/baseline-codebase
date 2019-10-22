/**
 * @flow
 */

import * as React from "react";

import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";

import _get from "lodash/get";

import { type Resource } from "rex-graphql/Resource";
import { unstable_useResource as useResource } from "rex-graphql/Resource";

import { withResourceErrorCatcher } from "../../helpers/withResourceErrorCatcher";

import { ComponentLoading } from "../../components/ComponentLoading";

import type { TRendererProps, TShowProps, TShowPropsBase } from "./types";

const styles = theme => ({
  root: {
    width: "100%",
    marginTop: theme.spacing.unit,
    overflowX: "auto"
  },
  table: {
    minWidth: 420
  }
});

const ViewRendererSuspended = withStyles(styles)(
  ({ resource, Renderer, catcher, classes, fetch }: TRendererProps) => {
    const resourceData = withResourceErrorCatcher({
      getResource: () => useResource(resource),
      catcher
    });

    if (resourceData == null) {
      return null;
    }

    const data = _get(resourceData, fetch);

    if (data == null) {
      throw new Error(`data for fetch "${fetch}" is null`);
    }

    // Field values from 0 element of data array
    const tableHeadingKeys = Object.keys(data[0]).sort();

    const whatToRender = Renderer ? (
      <Renderer data={data} />
    ) : (
      <Grid container>
        <Grid item xs={12}>
          <Paper className={classes.root}>
            <Table className={classes.table} aria-label="simple table">
              <TableHead>
                <TableRow>
                  {tableHeadingKeys.map(objKey => {
                    return (
                      <TableCell align="left" key={objKey}>
                        {objKey}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map(row => {
                  return (
                    <TableRow key={row.id}>
                      {tableHeadingKeys.map((headingKey, index) => {
                        return (
                          <TableCell key={headingKey} align="left">
                            <span>{String(row[headingKey])}</span>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    );

    return whatToRender;
  }
);

export const ViewRenderer = ({
  resource,
  Renderer,
  ...rest
}: {
  ...TRendererProps
}) => (
  <React.Suspense fallback={ComponentLoading}>
    <ViewRendererSuspended resource={resource} {...rest} Renderer={Renderer} />
  </React.Suspense>
);
