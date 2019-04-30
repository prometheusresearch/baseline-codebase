/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import "codemirror/lib/codemirror.css";

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as mui from "@material-ui/core";
import Codemirror from "react-codemirror";
import * as ReactUtil from "rex-ui/ReactUtil";

type Props = {|
  value: string,
  error?: boolean,
  onChange: (nextValue: null | string) => void
|};

export let SourceCodeInput = React.forwardRef<Props, HTMLElement>(
  ({ error: _error, ...props }: Props, ref) => {
    let onCodeMirror = codeMirror => {
      ReactUtil.setReactRef(ref, (ReactDOM.findDOMNode(codeMirror): any));
      if (codeMirror != null) {
        setTimeout(() => codeMirror.getCodeMirror().refresh(), 0);
      }
    };
    // NOTE(andreypopp): This is mui's <Input /> border. I'd rather not hardcode
    // this here but it's hard coded in mui's <Input /> as well.
    let border = "1px solid rgba(0, 0, 0, 0.42)";
    return (
      <mui.Paper square={true} elevation={0} style={{ border }}>
        <Codemirror
          {...props}
          ref={onCodeMirror}
          options={{ lineNumbers: true }}
        />
      </mui.Paper>
    );
  }
);
