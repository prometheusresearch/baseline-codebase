/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import * as Stylesheet    from '@prometheusresearch/react-stylesheet';
import {VBox}             from '@prometheusresearch/react-box';
import style              from 'rex-widget/lib/StyleUtils';

@Stylesheet.styleable
class ChromeRoot extends React.Component {

  static stylesheet = Stylesheet.createStylesheet({
    Wrapper: {
      Component: VBox,
      flex: 1,
      background: style.rgb(244, 244, 244),
    },
    Action: {
      Component: VBox,
      flex: 1,
      width: 800,
      margin: style.margin(0, style.auto),
      background: style.rgb(255, 255, 255),
      boxShadow: style.boxShadow(0, 0, 2, 1, style.rgb(204, 204, 204)),
    },
  });

  render() {
    let {Wrapper, Action} = this.stylesheet;
    let {children} = this.props;
    return (
      <Wrapper>
        <Action>
          {children}
        </Action>
      </Wrapper>
    );
  }
}

@ReactStylesheet
export default class ActionWizard extends React.Component {

  static propTypes = {
    noChrome: PropTypes.bool
  };

  static stylesheet = {
    Root: {
      Component: VBox,
      flex: 1
    },
    ChromeRoot,
  };

  render() {
    let {ChromeRoot, Root} = this.stylesheet;
    let {action, noChrome} = this.props;
    action = React.cloneElement(this.props.action, {
      context: {}
    });
    return noChrome ?
      <Root>{action}</Root> :
      <ChromeRoot>{action}</ChromeRoot>;
  }
}
