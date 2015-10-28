/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind         from 'autobind-decorator';
import * as Stylesheet  from '@prometheusresearch/react-stylesheet';
import {VBox, HBox}     from '@prometheusresearch/react-box';
import React            from 'react';

@Stylesheet.styleable
export default class Sidebar extends React.Component {

  static stylesheet = Stylesheet.createStylesheet({
    Self: {
      Component: VBox,
      background: '#fafafa',
    }
  });

  render() {
    let {children, ...props} = this.props;
    let {Self} = this.stylesheet;
    return (
      <Self {...props}>
        {children}
      </Self>
    );
  }
}
