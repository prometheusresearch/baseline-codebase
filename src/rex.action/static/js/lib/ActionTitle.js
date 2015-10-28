/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import * as Stylesheet    from '@prometheusresearch/react-stylesheet';
import {VBox}             from '@prometheusresearch/react-box';

function getTitleAtPosition(position) {
  let {type: Component, props} = position.element;
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

@Stylesheet.styleable
export default class ActionTitle extends React.Component {

  static propTypes = {

    position: PropTypes.object.isRequired,

    subTitle: PropTypes.node,

    noRichTitle: PropTypes.bool,
  };

  static stylesheet = Stylesheet.createStylesheet({
    Primary: {
      Component: VBox,
    },
    Secondary: {
      Component: VBox,
      opacity: 0.7,
      fontSize: '90%',
    },
  });

  static getTitleAtPosition = getTitleAtPosition;

  render() {
    let {Primary, Secondary} = this.stylesheet;
    let {position, subTitle, titleOnly, noRichTitle, ...props} = this.props;
    if (position.element.type.renderTitle && !noRichTitle) {
      return position.element.type.renderTitle(
        position.element.props,
        position.context
      );
    } else if (subTitle) {
      let title = getTitleAtPosition(position);
      return (
        <VBox>
          <Primary>{title}</Primary>
          <Secondary>{subTitle}</Secondary>
        </VBox>
      );
    } else {
      let title = getTitleAtPosition(position);
      return <Primary>{title}</Primary>;
    }
  }
}

