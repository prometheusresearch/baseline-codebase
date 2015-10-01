/**
 * @copyright 2014, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import cx                 from 'classnames';
import {VBox}             from './Layout';

/**
 * @deprecated
 * @public
 */
export default class Tab extends React.Component {

  static propTypes = {
    disabled: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
  };

  static defaultProps = {
    size: 1,
  };

  render() {
    let  {className, children, ...props} = this.props;
    return (
      <VBox {...props}
        title={undefined}
        id={undefined}
        className={cx('rw-Tab', className)}>
        {children}
      </VBox>
    );
  }
}
