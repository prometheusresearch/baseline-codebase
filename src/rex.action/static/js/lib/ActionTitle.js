/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';

import * as Stylesheet from 'rex-widget/stylesheet';
import {VBox} from 'rex-widget/layout';

export function getTitleAtNode(node) {
  let {type: Component, props} = node.element;
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

@Stylesheet.attach
export default class ActionTitle extends React.Component {

  static propTypes = {

    node: PropTypes.object.isRequired,

    subTitle: PropTypes.node,

    noRichTitle: PropTypes.bool,
  };

  static stylesheet = Stylesheet.create({
    Primary: {
      Component: VBox,
      noWrap: {
        whiteSpace: 'nowrap',
      }
    },
    Secondary: {
      Component: VBox,
      opacity: 0.7,
      fontSize: '90%',
      noWrap: {
        whiteSpace: 'nowrap',
      }
    },
  });

  render() {
    let {Primary, Secondary} = this.stylesheet;
    let {node, subTitle, titleOnly, noRichTitle, noWrap, ...props} = this.props;
    if (node.element.type.renderTitle && !noRichTitle) {
      return node.element.type.renderTitle(
        node.element.props,
        node.context
      );
    }
    let title = getTitleAtNode(node);
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

