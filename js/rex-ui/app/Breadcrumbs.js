// @flow

import * as React from "react";
import { Link as RouterLink } from "react-router-dom";
import { makeStyles } from "rex-ui/Theme";
import * as mui from "@material-ui/core";

import { type Breadcrumb } from "./Route";

let useStyles = makeStyles(theme => {
  return {
    root: {
      backgroundColor: "#FFFFFF",
      padding: theme.spacing.unit,
    },
    ol: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      padding: "0 16px",
      margin: 0,
      listStyle: "none",
    },
    separator: {
      display: "flex",
      userSelect: "none",
      marginLeft: 8,
      marginRight: 8,
    },
  };
});

type BreadcrumbsProps = {|
  breadcrumbs: Array<Breadcrumb>,
  separator?: string,
|};

function Link({ crumb, isLast }: {| crumb: Breadcrumb, isLast?: boolean |}) {
  return isLast ? (
    <mui.Typography color="textPrimary">{crumb.title}</mui.Typography>
  ) : (
    <mui.Link component={RouterLink} color="inherit" to={crumb.path}>
      {crumb.title}
    </mui.Link>
  );
}

function withSeparators(
  breadcrumbs: Breadcrumb[],
  className,
  separator,
): Array<React.Node> {
  return breadcrumbs.reduce((acc, current, index, breadcrumbs) => {
    if (index < breadcrumbs.length - 1) {
      acc = acc.concat(
        <li key={current.path}>
          <Link crumb={current} />
        </li>,
        <li aria-hidden key={`separator-${index}`} className={className}>
          {separator}
        </li>,
      );
    } else {
      acc.push(
        <li key={current.path}>
          <Link crumb={current} isLast />
        </li>,
      );
    }
    return acc;
  }, []);
}

export function Breadcrumbs({
  breadcrumbs,
  separator = "/",
}: BreadcrumbsProps) {
  let classes = useStyles();
  if (breadcrumbs.length <= 1) {
    return null;
  }
  return (
    <mui.Typography
      component="nav"
      color="textSecondary"
      className={classes.root}
    >
      <ol className={classes.ol}>
        {withSeparators(breadcrumbs, classes.separator, separator)}
      </ol>
    </mui.Typography>
  );
}
