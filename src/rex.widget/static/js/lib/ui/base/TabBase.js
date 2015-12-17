/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import {VBox} from '@prometheusresearch/react-box';
import * as Stylesheet from 'react-stylesheet';

@Stylesheet.styleable
export default class TabBase extends React.Component {

  static propTypes = {
    disabled: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
  };

  static stylesheet = Stylesheet.createStylesheet({
    Root: VBox
  });

  render() {
    let  {children, ...props} = this.props;
    let {Root} = this.stylesheet;
    return (
      <Root {...props} title={undefined} id={undefined}>
        {children}
      </Root>
    );
  }
}

