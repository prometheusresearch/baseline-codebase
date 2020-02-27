/**
 * @flow
 */

import * as React from "react";
import classNames from "classnames";

import { makeStyles } from "../Theme.js";

import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";

import { type Endpoint } from "rex-graphql";
import { type Resource, useResource } from "rex-graphql/Resource2";
import { RenderValue } from "./RenderValue.js";
import * as Field from "./Field.js";

// TODO(andreypopp): we need to type it
export type ShowRenderTitle = React.AbstractComponent<{| data: any |}>;

export type ShowRendererConfigProps = {|
  RenderTitle?: ?ShowRenderTitle,
  RenderToolbar?: ?RenderToolbar,
|};

// TODO(andreypopp): we need to type it
export type RenderToolbarProps = {|
  data: any,
  onAdd?: () => void,
  onRemove?: () => void,
|};

export type RenderToolbar = React.AbstractComponent<RenderToolbarProps>;

export type ShowRendererProps<V, R> = {|
  endpoint: Endpoint,
  resource: Resource<V, R>,
  getRows: R => any,
  args?: { [key: string]: any },
  catcher?: (err: Error) => void,
  fieldSpecs: Field.FieldSpec[],
  titleField?: ?Field.FieldSpec,
  onClick?: (row: any) => void,
  onAdd?: () => void,
  onRemove?: () => void,

  ...ShowRendererConfigProps,
|};

export let ShowRenderer = <V, R>(props: ShowRendererProps<V, R>) => {
  let {
    endpoint,
    resource,
    getRows,
    args = {},
    RenderTitle,
    fieldSpecs,
    titleField,
    onClick,
    RenderToolbar,
    onAdd,
    onRemove,
  } = props;

  let [isFetching, resourceData] = useResource(endpoint, resource, (args: any));

  if (isFetching || resourceData == null) {
    return <ShowCard404 />;
  }

  let data = getRows(resourceData);
  if (data == null) {
    return <ShowCard404 />;
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
      titleField={titleField}
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
  titleSmall: {
    fontSize: 16,
  },
  contentWrapper: {
    marginBottom: "16px",
    wordBreak: "break-word",
  },
}));

export const ShowCard404 = () => {
  let classes = useStyles();

  return (
    <Grid>
      <Grid item xs={12}>
        <Paper className={classes.root}>
          <Card raised={false}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                className={classes.titleSmall}
              >
                Not found
              </Typography>
            </CardContent>
          </Card>
        </Paper>
      </Grid>
    </Grid>
  );
};

export let ShowCard = ({
  data,
  title,
  fieldSpecs,
  titleField,
  onClick,
  toolbar,
}: {|
  data: any,
  title: React.Node,
  fieldSpecs: Field.FieldSpec[],
  titleField?: ?Field.FieldSpec,

  onClick?: () => void,
  toolbar?: React.Node,
|}) => {
  let classes = useStyles();

  let content = [];
  // eslint-disable-next-line no-unused-vars
  for (let spec of fieldSpecs) {
    let value = data[spec.name];
    content.push(
      <div key={spec.name} className={classes.contentWrapper}>
        <Typography variant={"caption"}>{spec.title}</Typography>
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

  let titleNode: React.Node = title;
  if (titleField != null) {
    titleNode = data[titleField.name];
  }

  return (
    <Grid container>
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
              <Typography variant="h5" gutterBottom className={classes.title}>
                {titleNode}
              </Typography>
              {content}
              {toolbar != null ? <div>{toolbar}</div> : null}
            </CardContent>
          </Card>
        </Paper>
      </Grid>
    </Grid>
  );
};
