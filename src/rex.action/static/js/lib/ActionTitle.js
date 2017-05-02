/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import type {Position} from './model/types';

import * as React from 'react';
import {Element} from 'react-stylesheet';

export function getTitleAtPosition(position: Position) {
  const {element} = position.instruction.action;
  let {type: Component, props} = element;
  if (Component.getTitle) {
    return Component.getTitle(props);
  } else if (props.title) {
    return props.title;
  } else if (Component.defaultProps && Component.defaultProps.title) {
    return Component.defaultProps.title;
  } else if (Component.getDefaultProps) {
    return Component.getDefaultProps().title;
  } else {
    return '';
  }
}

export default class ActionTitle extends React.Component {
  props: {
    position: Position,
    subTitle?: string,
    noRichTitle?: boolean,
    noWrap?: boolean,
  };

  render() {
    const {position, subTitle, noRichTitle, noWrap} = this.props;
    const {element} = position.instruction.action;
    if (element.type.renderTitle && !noRichTitle) {
      return element.type.renderTitle(element.props, position.context);
    }
    const title = getTitleAtPosition(position);
    if (subTitle) {
      return (
        <Element display="inline">
          <Element whiteSpace={noWrap ? 'nowrap' : undefined}>{title}</Element>
          <Element fontSize="90%" opacity={0.7} whiteSpace={noWrap ? 'nowrap' : undefined}>
            {subTitle}
          </Element>
        </Element>
      );
    } else {
      return (
        <Element display="inline" whiteSpace={noWrap ? 'nowrap' : undefined}>
          {title}
        </Element>
      );
    }
  }
}
