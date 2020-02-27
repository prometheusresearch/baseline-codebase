/**
 * @copyright 2019, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import * as styles from "@material-ui/styles";
import { fade } from "@material-ui/core/styles/colorManipulator";
import { type Theme } from "./Theme.js";
import { type Props, ButtonIcon } from "./Button";

let useStyles = styles.makeStyles((theme: Theme) => {
  let colors = theme.palette.error;
  let backgroundColorOnHover = fade(
    colors.main,
    theme.palette.action.hoverOpacity,
  );
  return {
    root: {
      alignItems: "unset !important",
    },
    text: {
      color: `${theme.palette.error.main} !important`,
      transition: `color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms`,

      "&$disabled": {
        color: `${theme.palette.error.main} !important`,
        opacity: 0.5,
      },
      "&:hover": {
        backgroundColor: `${backgroundColorOnHover} !important`,
      },
    },
    disabled: {},
    contained: {
      color: `${theme.palette.common.white} !important`,
      backgroundColor: `${theme.palette.error.dark} !important`,
      "&$disabled": {
        opacity: 0.5,
      },
    },
  };
});

export let DangerButton = (props: Props) => {
  let { icon, children, size, ...rest } = props;
  let classes = useStyles();
  return (
    <mui.Button {...rest} classes={classes} size={size}>
      <ButtonIcon icon={icon} hasChildren={children != null} size={size} />
      {children}
    </mui.Button>
  );
};
