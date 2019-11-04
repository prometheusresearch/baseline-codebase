/**
 * @flow
 */

import * as React from "react";
import invariant from "invariant";
import {
  type DocumentNode,
  type FieldNode,
  type OperationDefinitionNode,
  type VariableDefinitionNode
} from "graphql/language/ast";

import { useQuery, type Endpoint, type Result } from "rex-graphql";

import { makeStyles, useTheme } from "@material-ui/styles";
import { unstable_useMediaQuery as useMediaQuery } from "@material-ui/core/useMediaQuery";

import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";

import _get from "lodash/get";

import {
  type Resource,
  unstable_useResource as useResource
} from "rex-graphql/Resource";

import { withResourceErrorCatcher, calculateItemsLimit } from "./helpers";

import { ComponentLoading } from "./component.loading";
import { object } from "prop-types";

type CustomRendererProps = { resource: Resource<any, any> };

export type ShowRendererProps = {|
  resource: Resource<any, any>,
  fetch: string,
  Renderer?: React.ComponentType<CustomRendererProps>,
  args?: { [key: string]: any },
  catcher?: (err: Error) => void,
  renderTitle?: ({| data: any |}) => React.Node
|};

const useStyles = makeStyles({
  root: {
    width: "100%",
    marginTop: "8px",
    overflowX: "auto"
  }
});

export const ShowRenderer = ({
  resource,
  Renderer,
  fetch,
  args = {},
  renderTitle
}: ShowRendererProps) => {
  const classes = useStyles();

  const resourceData = useResource(resource, { ...args });

  if (resourceData == null) {
    return null;
  }

  const data = _get(resourceData, fetch);

  const { id, name, ...rest } = data;

  const sortedData = Object.keys(rest)
    .sort()
    .reduce((acc, dataKey) => ({ ...acc, [dataKey]: rest[dataKey] }), {
      id,
      name
    });

  let title = null;
  if (renderTitle != null) {
    title = renderTitle({ data });
  }

  return <ShowCard title={title} data={sortedData} />;
};

const commonWrapperStyle = { marginBottom: "16px" };

export const ShowCard = ({ data, title }: { data: any, title: React.Node }) => {
  const classes = useStyles();

  const content = Object.keys(data).map(dataKey => {
    switch (dataKey) {
      case "id": {
        return (
          <div key={dataKey} style={commonWrapperStyle}>
            <Typography key={dataKey} color="textSecondary" gutterBottom>
              {data[dataKey]}
            </Typography>
          </div>
        );
      }
      case "name": {
        return (
          <div key={dataKey} style={commonWrapperStyle}>
            <Typography
              variant="h5"
              component="h3"
              style={{ marginBottom: "16" }}
            >
              {data[dataKey]}
            </Typography>
          </div>
        );
      }
      default: {
        return (
          <div key={dataKey} style={commonWrapperStyle}>
            <Typography variant={"caption"}>{dataKey}</Typography>
            <Typography component="p">{String(data[dataKey])}</Typography>
          </div>
        );
      }
    }
  });

  return (
    <Grid container>
      <Grid item xs={12}>
        <Paper className={classes.root}>
          <Card>
            <CardContent>
              {title != null && (
                <Typography variant="h5" gutterBottom>
                  {title}
                </Typography>
              )}
              {content}
            </CardContent>
          </Card>
        </Paper>
      </Grid>
    </Grid>
  );
};
