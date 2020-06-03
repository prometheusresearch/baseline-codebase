// @flow

import cx from "classnames";
import * as React from "react";
import * as mui from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import { red } from "@material-ui/core/colors";

export type ActionConfig<V, O> = {|
  /** Action name, should be unique across actions for the specific view. */
  name: string,

  /** Action title, used for labels. */
  title: string,

  /** Execute action. */
  run: ({| data: O, params: V |}) => any,

  /** Action kind. */
  kind?: ActionKind,

  /** If action should be disabled. */
  disabled?: ({| data: O |}) => boolean,

  /** If action should be hidden. */
  hidden?: ({| data: O |}) => boolean,

  /** TODO(andreypopp): add docs */
  all?: boolean,

  /**
   * Render action button.
   *
   * If not provided the default rendering strategy will be used instead.
   */
  render?: ({|
    data: O,
    params: V,
    action: ActionConfig<V, O>,
  |}) => React.Node,
|};

type ActionKind = "primary" | "regular" | "delete";

export function render<V, O>(
  action: ActionConfig<V, O>,
  data: O,
  params: V,
  ButtonProps?: mui.ButtonProps,
): React.Node {
  if (action.render) {
    return action.render({ data, action, params });
  } else {
    return (
      <ActionButton
        action={action}
        data={data}
        params={params}
        ButtonProps={ButtonProps}
      />
    );
  }
}

type ActionButtonProps<V, O> = {|
  action: ActionConfig<V, O>,
  data: O,
  params: V,
  ButtonProps?: mui.ButtonProps,
|};

export function ActionButton<V, O>({
  action,
  data,
  params,
  ButtonProps,
}: ActionButtonProps<V, O>) {
  let classes = useStyles();
  let onClick = () => {
    action.run({ data, params });
  };
  let buttonDefaultProps: mui.ButtonProps = {
    size: "small",
  };
  let buttonProps = {
    ...buttonDefaultProps,
    ...ButtonProps,
  };
  let kind = action.kind ?? "regular";
  let hidden = action.hidden?.({ data }) ?? false;
  if (hidden) {
    return null;
  } else {
    let disabled = action.disabled?.({ data }) ?? false;
    return (
      <mui.Button
        onClick={onClick}
        disabled={disabled}
        classes={{
          root: cx({
            [classes.ActionButton__delete]: kind === "delete",
            [classes.ActionButton__primary]: kind === "primary",
          }),
        }}
        {...buttonProps}
      >
        {action.title}
      </mui.Button>
    );
  }
}

let useStyles = makeStyles(theme => ({
  ActionButton__delete: {
    color: red[500],
    borderColor: red[500],
  },
  ActionButton__primary: {
    color: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
  },
}));
