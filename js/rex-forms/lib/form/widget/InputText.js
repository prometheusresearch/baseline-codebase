/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as ReactForms from "react-forms/reactive";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";
import * as HotKey from "./HotKey";

import Widget from "../Widget";
import type { WidgetProps, WidgetInputProps } from "../WidgetConfig.js";

const WIDTH = {
  small: "25%",
  medium: "50%",
  large: "100%"
};

type Props = {|
  ...WidgetProps,
  renderInput?: WidgetInputProps => React.Node,
  children?: React.Node
|};

export default function InputText({
  editable,
  onCommitEdit,
  onCancelEdit,
  options,
  renderInput,
  children,
  ...props
}: Props) {
  if (renderInput == null && children == null) {
    renderInput = props => (
      <ReactForms.Input {...props} Component={ReactUI.Input} />
    );
  }
  let { width = "medium" } = options;
  return (
    <ReactUI.Block width={WIDTH[width]}>
      <HotKey.EditHotKeyHandler
        editable={editable}
        onCommitEdit={onCommitEdit}
        onCancelEdit={onCancelEdit}
      >
        <Widget
          {...props}
          editable={editable}
          renderInput={renderInput}
          children={children}
        />
      </HotKey.EditHotKeyHandler>
    </ReactUI.Block>
  );
}
