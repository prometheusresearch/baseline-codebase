/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import cx                 from 'classnames';
import {Themeable}        from 'rethemeable';
import {VBox}             from './Layout';
import Icon               from './Icon';
import Style              from './IconButton.module.css';

@Themeable
/**
 * Icon component which behaves like a button.
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
    let {name, ...props} = this.props;
    return (
      <VBox {...props} role="button">
        <Icon
          name={name}
          aria-hidden={false}
          className={this.theme.self}
          />
      </VBox>
    );
  }
}
