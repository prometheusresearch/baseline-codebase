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

export type TypePropsRenderer = {|
  resource: Resource<any, any>,
  Renderer?: React.ComponentType<CustomRendererProps>,
  dataObject?: object,
  fetch: string,
  ast: DocumentNode,
  args?: { [key: string]: any },
  catcher: (err: Error) => void
|};

const useStyles = makeStyles({
  root: {
    width: "100%",
    marginTop: "8px",
    overflowX: "auto"
  }
});

const containerRef = React.createRef();

export const ShowRenderer = ({
  resource,
  Renderer,
  catcher,
  fetch,
  ast,
  args = {}
}: TypePropsRenderer) => {
  let { definitions: _definitions } = ast;
  const definitions: OperationDefinitionNode[] = (_definitions: any);
  const queryDefinition = definitions[0];

  invariant(queryDefinition != null, "queryDefinition is null");

  const classes = useStyles();

  const resourceData = withResourceErrorCatcher({
    getResource: () => useResource(resource, { ...args }),
    catcher
  });

  if (resourceData == null) {
    return null;
  }

  const data = _get(resourceData, fetch);

  const { id, name, ...rest } = data;

  const sortedData = Object.keys(rest).reduce(
    (acc, dataKey) => ({ ...acc, [dataKey]: rest[dataKey] }),
    {
      id,
      name
    }
  );

  const whatToRender = Renderer ? (
    <Renderer resource={resourceData} />
  ) : (
    <div ref={containerRef}>
      <ShowCard data={sortedData} />
    </div>
  );

  return whatToRender;
};

const commonWrapperStyle = { marginBottom: "16px" };
export const ShowCard = ({ data }: { data: any }) => {
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
            <CardContent>{content}</CardContent>
          </Card>
        </Paper>
      </Grid>
    </Grid>
  );
};
