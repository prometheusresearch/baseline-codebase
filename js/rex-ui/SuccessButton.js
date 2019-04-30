/**
 * @copyright 2019, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import * as styles from "@material-ui/styles";
import { fade } from "@material-ui/core/styles/colorManipulator";
import { useTheme, type Theme } from "./Theme.js";
import { type Props, ButtonIcon } from "./Button";

let useStyles = styles.makeStyles((theme: Theme) => {
  let colors = theme.palette.success;
  let { white } = theme.palette.common;

  let backgroundColorOnHover = fade(
    colors.main,
    theme.palette.action.hoverOpacity
  );

  return {
    root: {
      alignItems: "unset !important"
    },
    text: {
      color: `${colors.main} !important`,
      "&$disabled": {
        color: `${colors.main} !important`,
        opacity: 0.5
      },
      "&:hover": {
        backgroundColor: `${backgroundColorOnHover} !important`
      }
    },
    disabled: {},
    contained: {
      color: `${white} !important`,
      backgroundColor: `${colors.main} !important`,
      "&$disabled": {
        color: `${white} !important`,
        opacity: 0.5
      }
    }
  };
});

export let SuccessButton = (props: Props) => {
  let theme = useTheme();
  let { icon, children, size, ...rest } = props;
  let classes = useStyles();
  return (
    <mui.Button {...rest} classes={classes} size={size}>
      <ButtonIcon icon={icon} hasChildren={children != null} size={size} />
      {children}
    </mui.Button>
  );
};
