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
import { type FieldSpec } from "./buildQuery";

import { calculateItemsLimit, sortObjectFieldsWithPreferred } from "./helpers";

type CustomRendererProps = { resource: Resource<any, any> };

export type ShowRendererProps = {|
  resource: Resource<any, any>,
  fetch: string,
  Renderer?: React.ComponentType<CustomRendererProps>,
  args?: { [key: string]: any },
  catcher?: (err: Error) => void,
  renderTitle?: ({| data: any |}) => React.Node,
  columns: FieldSpec[]
|};

const useStyles = makeStyles({
  root: {
    width: "100%",
    marginTop: "8px",
    overflowX: "auto"
  }
});

export const ShowRenderer = (props: ShowRendererProps) => {
  const { resource, Renderer, fetch, args = {}, renderTitle, columns } = props;

  const classes = useStyles();

  const resourceData = useResource(resource, { ...args });

  if (resourceData == null) {
    return null;
  }

  const data = _get(resourceData, fetch);

  const sortedData = sortObjectFieldsWithPreferred(data);

  let title = null;
  if (renderTitle != null) {
    title = renderTitle({ data });
  }

  return <ShowCard title={title} data={sortedData} columns={columns} />;
};

const commonWrapperStyle = { marginBottom: "16px", wordBreak: "break-word" };

export const ShowCard = ({
  data,
  title,
  columns
}: {
  data: any,
  title: React.Node,
  columns: FieldSpec[]
}) => {
  const classes = useStyles();

  const content = Object.keys(data).map(dataKey => {
    const column = columns.find(spec => spec.require.field === dataKey);

    // No such a column at all.
    // dataKey is likely placed there by sortObjectFieldsWithPreferred
    if (!column) {
      return null;
    }

    switch (dataKey) {
      case "id": {
        return (
          <div key={dataKey} style={commonWrapperStyle}>
            {column && column.render ? (
              <column.render value={data[dataKey]} />
            ) : (
              <Typography
                variant={"h6"}
                key={dataKey}
                color="textSecondary"
                gutterBottom
              >
                {data[dataKey]}
              </Typography>
            )}
          </div>
        );
      }

      default: {
        return (
          <div key={dataKey} style={commonWrapperStyle}>
            <Typography variant={"caption"}>
              {(column && column.title) || dataKey}
            </Typography>
            <Typography component="p">
              {column && column.render ? (
                <column.render value={data[dataKey]} />
              ) : (
                String(data[dataKey])
              )}
            </Typography>
          </div>
        );
      }
    }
  });

  return (
    <Grid container spacing={8}>
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
