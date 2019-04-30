/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import { VBox } from "react-stylesheet";
import * as rexui from "rex-ui";

type Props = {|
  content?: React.Node,
  children?: React.Node,
  title?: string
|};

export default function Chrome(props: Props) {
  let { content, children, title, ...rest } = props;

  React.useEffect(() => {
    if (title != null) {
      document.title = title;
    }
  }, [title]);

  return (
    <rexui.ThemeProvider>
      <VBox
        {...rest}
        height="100%"
        width="100%"
        flexGrow={1}
        flexShrink={1}
      >
        {children || content}
      </VBox>
    </rexui.ThemeProvider>
  );
}
