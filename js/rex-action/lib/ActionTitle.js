/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import type { Position } from "./model/types";

import * as React from "react";
import * as mui from "@material-ui/core";
import * as icons from "@material-ui/icons";

import { Element } from "react-stylesheet";
import { TitleBase } from "./actions/Title";

export function getTitleAtPosition(position: Position) {
  const { element } = position.instruction.action;
  let { type: Component, props } = element;
  if (Component.getTitle) {
    return Component.getTitle(props);
  } else if (props.title) {
    return props.title;
  } else if (Component.defaultProps && Component.defaultProps.title) {
    return Component.defaultProps.title;
  } else if (Component.getDefaultProps) {
    return Component.getDefaultProps().title;
  } else {
    return "";
  }
}

type Props = {|
  position: Position,
  subtitle?: ?string,
  noRichTitle?: boolean,
  noWrap?: boolean
|};

export default function ActionTitle(props: Props) {
  const { position, subtitle, noRichTitle, noWrap } = props;
  const { element } = position.instruction.action;
  if (element.type.renderTitle && !noRichTitle) {
    return element.type.renderTitle(element.props, position.context);
  } else {
    const title = getTitleAtPosition(position);
    return <TitleBase subtitle={subtitle} title={title} />;
  }
}
