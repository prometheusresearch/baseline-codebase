/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';

import * as Stylesheet from 'rex-widget/stylesheet';
import * as CSS from 'rex-widget/css';
import {VBox} from 'rex-widget/layout';

export class ChromeRoot extends React.Component {
  static stylesheet = Stylesheet.create({
    Wrapper: {
      Component: VBox,
      flex: 1,
      background: CSS.rgb(244, 244, 244),
    },
    Action: {
      Component: VBox,
      flex: 1,
      width: 800,
      margin: CSS.margin(0, CSS.auto),
      background: CSS.rgb(255, 255, 255),
      boxShadow: CSS.boxShadow(0, 0, 2, 1, CSS.rgb(204, 204, 204)),
    },
  });

  render() {
    let {Wrapper, Action} = this.constructor.stylesheet;
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

export default class ActionWizard extends React.Component {
  static propTypes = {
    noChrome: PropTypes.bool,
  };

  static stylesheet = Stylesheet.create({
    Root: {
      Component: VBox,
      flex: 1,
    },
    ChromeRoot,
  });

  render() {
    let {ChromeRoot, Root} = this.constructor.stylesheet;
    let {action, noChrome} = this.props;
    action = React.cloneElement(this.props.action, {
      context: {},
    });
    return noChrome ? <Root>{action}</Root> : <ChromeRoot>{action}</ChromeRoot>;
  }
}
