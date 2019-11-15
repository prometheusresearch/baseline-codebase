/**
 * @copyright 2019-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as rexui from "rex-ui";
import * as icons from "@material-ui/icons";
import * as styles from "@material-ui/styles";
import { getComponentDisplayName } from "./ReactUtil";

let fontStack = [
  "Roboto",
  "-apple-system",
  "BlinkMacSystemFont",
  '"Segoe UI"',
  "Roboto",
  "Oxygen-Sans",
  "Ubuntu",
  "Cantarell",
  '"Helvetica Neue"',
  "sans-serif"
];

let useStyles = styles.makeStyles(theme => ({
  demo: {
    backgroundColor: "#ffffff",
    fontFamily: fontStack.join(",")
  },
  demoItem: {
    borderBottom: "1px solid #888888"
  },
  demoItemContent: {
    padding: 20
  },
  demoItemLabel: {
    padding: 5,
    paddingBottom: 20,
    fontSize: "10pt",
    fontFamily: "Menlo, Monaco, monospace",
    color: "#888"
  }
}));

export let Demo = ({ children }: {| children: React.Node |}) => {
  let classes = useStyles();
  return <div className={classes.demo}>{children}</div>;
};

export let DemoItem = ({
  children,
  label
}: {|
  children: React.Node,
  label?: string
|}) => {
  let classes = useStyles();
  return (
    <div className={classes.demoItem}>
      {label != null ? (
        <div className={classes.demoItemLabel}>{label}</div>
      ) : null}
      <div className={classes.demoItemContent}>{children}</div>
    </div>
  );
};

export function fixture<SP, P: SP>({
  name,
  namespace,
  render,
  component: Component,
  props
}: {|
  name?: string,
  namespace?: string,
  render?: (React.AbstractComponent<P>, SP) => React.Node,
  component: React.AbstractComponent<P>,
  props?: SP
|}) {
  let fixture = (props: P) => {
    let children = null;
    if (render != null) {
      children = render(Component, props);
    } else {
      children = <Component {...props} />;
    }
    return (
      <div>
        <rexui.ThemeProvider>{children}</rexui.ThemeProvider>
      </div>
    );
  };
  fixture.displayName = getComponentDisplayName(Component);
  return { name, namespace, component: fixture, props };
}

export let renderButtonFixture = <P>(
  Component: React.AbstractComponent<P>,
  props: P
) => {
  return (
    <Demo>
      <DemoItem label="regular">
        <Component {...props} />
      </DemoItem>
      <DemoItem label="regular, disabled">
        <Component disabled={true} {...props} />
      </DemoItem>
      <DemoItem label="contained">
        <Component variant="contained" {...props} />
      </DemoItem>
      <DemoItem label="contained, disabled">
        <Component variant="contained" disabled={true} {...props} />
      </DemoItem>
      <DemoItem label="with icon">
        <Component {...props} icon={<icons.PlusOne />} />
      </DemoItem>
      <DemoItem label="contained, with icon">
        <Component {...props} variant="contained" icon={<icons.PlusOne />} />
      </DemoItem>
      <DemoItem label="small">
        <Component {...props} size="small" />
      </DemoItem>
      <DemoItem label="small, contained">
        <Component {...props} size="small" variant="contained" />
      </DemoItem>
      <DemoItem label="small, contained, with icon">
        <Component
          {...props}
          size="small"
          variant="contained"
          icon={<icons.PlusOne />}
        />
      </DemoItem>
    </Demo>
  );
};
