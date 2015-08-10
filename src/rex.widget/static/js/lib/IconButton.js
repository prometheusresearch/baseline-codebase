/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import {Themeable}        from 'rethemeable';
import Icon               from './Icon';
import Style              from './IconButton.module.css';

@Themeable
/**
 * Icon components which behaves like a button.
 *
 * @public
 */
export default class IconButton extends React.Component {

  static propTypes = {

    /**
     * Name of the icon to render.
     *
     * See http://getbootstrap.com/components/#glyphicons-glyphs for all
     * available icons.
     */
    name: PropTypes.string.isRequired,

    /**
     * Callback which is executed on click.
     */
    onClick: PropTypes.func.isRequired
  };

  static defaultTheme = Style;

  render() {
    let {className, ...props} = this.props;
    return (
      <Icon
        {...props}
        role="button"
        aria-hidden={false}
        className={this.theme.self}
        />
    );
  }
}
