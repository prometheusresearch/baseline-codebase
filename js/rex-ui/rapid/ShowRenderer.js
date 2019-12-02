/**
 * @flow
 */

import * as React from "react";
import invariant from "invariant";
import classNames from "classnames";

import { makeStyles, useTheme } from "../Theme.js";

import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";

import {
  type Resource,
  unstable_useResource as useResource,
} from "rex-graphql/Resource";
import { RenderValue } from "./RenderValue.js";
import * as Field from "./Field.js";
import * as QueryPath from "./QueryPath.js";

export type ShowRenderTitle = React.AbstractComponent<{| data: any |}>;

export type ShowRendererConfigProps = {|
  RenderTitle?: ?ShowRenderTitle,
  RenderToolbar?: ?RenderToolbar,
|};

export type RenderToolbarProps = {|
  data: any,
  onAdd?: () => void,
  onRemove?: () => void,
|};

export type RenderToolbar = React.AbstractComponent<RenderToolbarProps>;

export type ShowRendererProps = {|
  resource: Resource<any, any>,
  path: QueryPath.QueryPath,
  args?: { [key: string]: any },
  catcher?: (err: Error) => void,
  fieldSpecs: { [name: string]: Field.FieldSpec },
  onClick?: (row: any) => void,
  onAdd?: () => void,
  onRemove?: () => void,

  ...ShowRendererConfigProps,
|};

export let ShowRenderer = (props: ShowRendererProps) => {
  let {
    resource,
    path,
    args = {},
    RenderTitle,
    fieldSpecs,
    onClick,
    RenderToolbar,
    onAdd,
    onRemove,
  } = props;

  let resourceData = useResource(resource, { ...args });

  if (resourceData == null) {
    return null;
  }

  let data = resourceData;
  for (let seg of QueryPath.toArray(path)) {
    data = data[seg];
    if (data == null) {
      return null;
    }
  }

  let title = null;
  if (RenderTitle != null) {
    title = <RenderTitle data={data} />;
  }

  return (
    <ShowCard
      onClick={onClick}
      title={title}
      data={data}
      fieldSpecs={fieldSpecs}
      toolbar={
        RenderToolbar != null ? (
          <RenderToolbar data={data} onAdd={onAdd} onRemove={onRemove} />
        ) : null
      }
    />
  );
};

let useStyles = makeStyles(theme => ({
  root: {
    width: "100%",
    marginTop: theme.spacing.unit,
    overflowX: "auto",
  },
  cardClickable: {
    cursor: "pointer",
    "&:hover": {
      opacity: 0.9,
    },
  },
  title: {
    marginBottom: theme.spacing.unit * 2,
  },
  contentWrapper: {
    marginBottom: "16px",
    wordBreak: "break-word",
  },
}));

export let ShowCard = ({
  data,
  title,
  fieldSpecs,
  onClick,
  toolbar,
}: {|
  data: any,
  title: React.Node,
  fieldSpecs: { [name: string]: Field.FieldSpec },
  onClick?: () => void,
  toolbar?: React.Node,
|}) => {
  let classes = useStyles();

  let content = [];
  for (let name in fieldSpecs) {
    let spec = fieldSpecs[name];
    let key = spec.require.field;
    let value = data[key];
    content.push(
      <div key={key} className={classes.contentWrapper}>
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
      </div>,
    );
  }

  return (
    <Grid container spacing={8}>
      <Grid item xs={12}>
        <Paper className={classes.root}>
          <Card
            raised={false}
            onClick={onClick}
            className={classNames({
              [classes.cardClickable]: onClick != null,
            })}
          >
            <CardContent>
              {title != null && (
                <Typography variant="h5" gutterBottom className={classes.title}>
                  {title}
                </Typography>
              )}
              {content}
              {toolbar != null ? <div>{toolbar}</div> : null}
            </CardContent>
          </Card>
        </Paper>
      </Grid>
    </Grid>
  );
};
