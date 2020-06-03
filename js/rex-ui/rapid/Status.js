// @flow

import * as React from "react";
import cx from "classnames";
import {
  Chip,
  Button,
  Grid,
  type ButtonProps,
  Snackbar,
} from "@material-ui/core";
import { makeStyles } from "./themes.js";
import InProgressIcon from "@material-ui/icons/PlayCircleFilled";
import SuccessIcon from "@material-ui/icons/CheckCircle";
import ErrorIcon from "@material-ui/icons/Error";
import WarningIcon from "@material-ui/icons/Warning";

export type Status = "inProgress" | "success" | "warning" | "error";

type StatusIconProps = {|
  status: Status,
  Icon?: React.AbstractComponent<{ className: string }>,
|};

export function StatusIcon({ status, Icon }: StatusIconProps) {
  let classes = useStyles();
  if (Icon) {
    return <Icon className={classes[status]} />;
  }
  switch (status) {
    case "success":
      return <SuccessIcon className={classes.success} />;
    case "inProgress":
      return <InProgressIcon className={classes.inProgress} />;
    case "warning":
      return <WarningIcon className={classes.warning} />;
    case "error":
      return <ErrorIcon className={classes.error} />;
    default:
      // eslint-disable-next-line no-unused-expressions
      (status: empty);
      return null;
  }
}

type StatusBadgeProps = {|
  status: Status,
  label?: string,
|};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  let classes = useStyles();
  switch (status) {
    case "success":
      return (
        <Chip
          component="span"
          className={cx({
            [classes.StatusBadge__root]: true,
            [classes.StatusBadge__root_success]: true,
          })}
          label={label || "Success"}
        />
      );
    case "inProgress":
      return (
        <Chip
          component="span"
          className={cx({
            [classes.StatusBadge__root]: true,
            [classes.StatusBadge__root_inProgress]: true,
          })}
          label={label || "In progress"}
        />
      );
    case "warning":
      return (
        <Chip
          component="span"
          className={cx({
            [classes.StatusBadge__root]: true,
            [classes.StatusBadge__root_warning]: true,
          })}
          label={label || "Warning"}
        />
      );
    case "error":
      return (
        <Chip
          component="span"
          className={cx({
            [classes.StatusBadge__root]: true,
            [classes.StatusBadge__root_error]: true,
          })}
          label={label || "Error"}
        />
      );
    default:
      // eslint-disable-next-line no-unused-expressions
      (status: empty);
      return null;
  }
}

type StatusButtonProps = {|
  ...ButtonProps,
  status: Status,
|};

export function StatusButton({
  status,
  className,
  ...props
}: StatusButtonProps) {
  let classes = useStyles();
  let buttonClassName = cx(className, {
    [classes.StatusButton__root_success]: status === "success",
    [classes.StatusButton__root_inProgress]: status === "inProgress",
    [classes.StatusButton__root_warning]: status === "warning",
    [classes.StatusButton__root_error]: status === "error",
  });
  return <Button {...props} className={buttonClassName} />;
}

type StatusMessageProps = {|
  status: Status,
  children: React.Node,
  style?: Object,
  className?: string,
|};

export function StatusMessage({
  status,
  children,
  className,
  style,
}: StatusMessageProps) {
  let classes = useStyles();
  let rootClassName = cx(className, classes.StatusMessage__root, {
    [classes.StatusMessage__root_success]: status === "success",
    [classes.StatusMessage__root_inProgress]: status === "inProgress",
    [classes.StatusMessage__root_warning]: status === "warning",
    [classes.StatusMessage__root_error]: status === "error",
  });
  return (
    <div className={rootClassName}>
      <Grid item container spacing={16} wrap="nowrap" style={style}>
        <Grid item className={classes.StatusMessage__icon}>
          <StatusIcon status={status} />
        </Grid>
        <Grid item>{children}</Grid>
      </Grid>
    </div>
  );
}

type StatusSnackProps = {|
  status: Status,
  style?: Object,
  className?: string,
  onClose?: () => void,
  open: boolean,
  message: string,
  autoHideDuration?: number,
  positionVertical?: "top" | "bottom",
  positionHorizontal?: "left" | "right" | "center",
|};

export function StatusSnack({
  status,
  className,
  style,
  open,
  onClose,
  message,
  autoHideDuration,
  positionHorizontal,
  positionVertical,
}: StatusSnackProps) {
  let classes = useStyles();
  let rootClassName = cx(className, {
    [classes.StatusSnack__root_success]: status === "success",
    [classes.StatusSnack__root_inProgress]: status === "inProgress",
    [classes.StatusSnack__root_warning]: status === "warning",
    [classes.StatusSnack__root_error]: status === "error",
  });
  return (
    <Snackbar
      anchorOrigin={{
        vertical: positionVertical ?? "bottom",
        horizontal: positionHorizontal ?? "left",
      }}
      open={open}
      onClose={onClose}
      autoHideDuration={autoHideDuration ?? 2000}
      ContentProps={{
        "aria-describedby": "message-id",
        classes: {
          root: rootClassName,
        },
      }}
      message={<span id="message-id">{message}</span>}
    />
  );
}

let useStyles = makeStyles(theme => ({
  success: {
    color: theme.status.successText ?? theme.palette.grey[400],
  },
  warning: {
    color: theme.status.warningText ?? theme.palette.grey[400],
  },
  error: {
    color: theme.status.errorText ?? theme.palette.grey[400],
  },
  inProgress: {
    color: theme.status.inProgressText ?? theme.palette.grey[400],
  },

  StatusMessage__root: {
    padding: theme.spacing.unit,
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    borderRadius: theme.shape.borderRadius,
  },
  StatusMessage__root_success: {
    backgroundColor: theme.status.successBackground,
  },
  StatusMessage__root_warning: {
    backgroundColor: theme.status.warningBackground,
  },
  StatusMessage__root_inProgress: {
    backgroundColor: theme.status.inProgressBackground,
  },
  StatusMessage__root_error: {
    backgroundColor: theme.status.errorBackground,
  },
  StatusMessage__icon: {
    height: 40,
  },

  StatusButton__root_success: {
    color: theme.status.successText,
  },
  StatusButton__root_warning: {
    color: theme.status.warningText,
  },
  StatusButton__root_inProgress: {
    color: theme.status.inProgressText,
  },
  StatusButton__root_error: {
    color: theme.status.errorText,
  },

  StatusBadge__root: {
    lineHeight: "1em",
    height: "1.75em",
    fontWeight: 400,
    borderRadius: 4,
    textTransform: "uppercase",
    fontSize: "0.8em",
    minWidth: 100,
  },
  StatusBadge__root_success: {
    color: theme.palette.common.white,
    backgroundColor: theme.status.successText ?? theme.palette.grey[400],
  },
  StatusBadge__root_inProgress: {
    color: theme.palette.common.white,
    backgroundColor: theme.status.inProgressText ?? theme.palette.grey[400],
  },
  StatusBadge__root_warning: {
    color: theme.palette.common.white,
    backgroundColor: theme.status.warningText ?? theme.palette.grey[400],
  },
  StatusBadge__root_error: {
    color: theme.palette.common.white,
    backgroundColor: theme.status.errorText ?? theme.palette.grey[400],
  },

  StatusSnack__root_success: {
    color: theme.palette.grey[600],
    backgroundColor: theme.status.successBackground,
  },
  StatusSnack__root_warning: {
    color: theme.palette.grey[600],
    backgroundColor: theme.status.warningBackground,
  },
  StatusSnack__root_inProgress: {
    color: theme.palette.grey[600],
    backgroundColor: theme.status.inProgressBackground,
  },
  StatusSnack__root_error: {
    color: theme.palette.grey[600],
    backgroundColor: theme.status.errorBackground,
  },
}));
