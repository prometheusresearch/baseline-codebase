/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import cx                 from 'classnames';

/**
 * Dispays an icon widget.
 *
 * @public
 */
export default class Icon extends React.Component {

  static propTypes = {

    /**
     * Name of the icon to render.
     *
     * See http://getbootstrap.com/components/#glyphicons-glyphs for all
     * available icons.
     */
    name: PropTypes.string.isRequired,

    /**
     * Extra CSS class name.
     */
    className: PropTypes.string
  };

  render() {
    let {className, name, ...props} = this.props;
    className = cx('glyphicon', `glyphicon-${name}`, className);
    return <i aria-hidden={true} {...props} className={className} />;
  }
}
