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
import { RenderValue } from "./RenderValue.js";

import * as Field from "./Field.js";

type CustomRendererProps = { resource: Resource<any, any> };

export type ShowRendererProps = {|
  resource: Resource<any, any>,
  fetch: string,
  Renderer?: React.ComponentType<CustomRendererProps>,
  args?: { [key: string]: any },
  catcher?: (err: Error) => void,
  renderTitle?: ({| data: any |}) => React.Node,
  columns: Field.FieldSpec[],
  onCardClick?: (row: any) => void
|};

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%",
    marginTop: "8px",
    overflowX: "auto"
  },
  card: {},
  cardClickable: {
    cursor: "pointer",
    "&:hover": {
      opacity: 0.9
    }
  }
}));

export const ShowRenderer = (props: ShowRendererProps) => {
  const {
    resource,
    Renderer,
    fetch,
    args = {},
    renderTitle,
    columns,
    onCardClick
  } = props;

  const classes = useStyles();

  const resourceData = useResource(resource, { ...args });

  if (resourceData == null) {
    return null;
  }

  const data = _get(resourceData, fetch);

  let title = null;
  if (renderTitle != null) {
    title = renderTitle({ data });
  }

  return (
    <ShowCard
      onCardClick={onCardClick}
      title={title}
      data={data}
      columns={columns}
    />
  );
};

const commonWrapperStyle = { marginBottom: "16px", wordBreak: "break-word" };

export const ShowCard = ({
  data,
  title,
  columns,
  onCardClick
}: {|
  data: any,
  title: React.Node,
  columns: Field.FieldSpec[],
  onCardClick?: () => void
|}) => {
  const classes = useStyles();

  let cardClassNames = [classes.card];
  if (onCardClick) {
    cardClassNames = [...cardClassNames, classes.cardClickable];
  }

  const content = columns.map(spec => {
    let key = spec.require.field;
    let value = data[key];
    return (
      <div key={key} style={commonWrapperStyle}>
        <Typography variant={"caption"}>
          {(spec && spec.title) || key}
        </Typography>
        <Typography component="p">
          {spec && spec.render ? (
            <spec.render value={value} />
          ) : (
            <RenderValue value={value} />
          )}
        </Typography>
      </div>
    );
  });

  return (
    <Grid container spacing={8}>
      <Grid item xs={12}>
        <Paper className={classes.root}>
          <Card onClick={onCardClick} className={cardClassNames.join(" ")}>
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
