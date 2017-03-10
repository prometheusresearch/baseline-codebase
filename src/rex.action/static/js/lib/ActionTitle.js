/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import React from 'react';

import * as Stylesheet from 'rex-widget/stylesheet';
import {VBox} from 'rex-widget/layout';
import type {Position} from './execution/State';

export function getTitleAtNode(position: Position) {
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

  static stylesheet = Stylesheet.create({
    Primary: {
      Component: VBox,
      noWrap: {
        whiteSpace: 'nowrap',
      },
    },
    Secondary: {
      Component: VBox,
      opacity: 0.7,
      fontSize: '90%',
      noWrap: {
        whiteSpace: 'nowrap',
      },
    },
  });

  render() {
    const {Primary, Secondary} = this.constructor.stylesheet;
    const {position, subTitle, noRichTitle, noWrap} = this.props;
    const {element} = position.instruction.action;
    if (element.type.renderTitle && !noRichTitle) {
      return element.type.renderTitle(element.props, position.context);
    }
    let title = getTitleAtNode(position);
    if (subTitle) {
      return (
        <VBox>
          <Primary variant={{noWrap}}>{title}</Primary>
          <Secondary variant={{noWrap}}>{subTitle}</Secondary>
        </VBox>
      );
    } else {
      return <Primary variant={{noWrap}}>{title}</Primary>;
    }
  }
}
