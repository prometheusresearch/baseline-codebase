/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import {VBox} from '../../../layout';
import * as Stylesheet from '../../../stylesheet';

export default class TabBase extends React.Component {

  static propTypes = {
    disabled: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
  };

  static stylesheet = Stylesheet.create({
    Root: {
      Component: VBox,
      overflow: 'auto',
    }
  });

  render() {
    let  {children, ...props} = this.props;
    let {Root} = this.constructor.stylesheet;
    return (
      <Root {...props} title={undefined} id={undefined}>
        {children}
      </Root>
    );
  }
}

