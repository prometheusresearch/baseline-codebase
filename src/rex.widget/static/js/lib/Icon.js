/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import cx                 from 'classnames';

export default class Icon extends React.Component {

  static propTypes = {
    name: PropTypes.string.isRequired,
    className: PropTypes.string
  };

  render() {
    let {className, name, ...props} = this.props;
    className = cx('glyphicon', `glyphicon-${name}`, className);
    return <i {...props} aria-hidden={true} className={className} />;
  }
}
