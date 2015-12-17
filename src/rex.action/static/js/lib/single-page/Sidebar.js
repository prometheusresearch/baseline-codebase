/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind from 'autobind-decorator';
import React from 'react';

import * as Stylesheet from 'rex-widget/stylesheet';
import {VBox, HBox} from 'rex-widget/layout';


@Stylesheet.attach
export default class Sidebar extends React.Component {

  static stylesheet = Stylesheet.create({
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
