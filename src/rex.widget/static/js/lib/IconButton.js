/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import Stylesheet         from '@prometheusresearch/react-stylesheet';
import {VBox}             from './Layout';
import Icon               from './Icon';
import Style              from './StyleUtils';

/**
 * Icon component which behaves like a button.
 *
 * @public
 */
@Stylesheet
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

  static stylesheet = {
    Root: {
      width: '1em',
      height: '1em',
      opacity: 0.2,
      cursor: Style.cursor.pointer,
      hover: {
        opacity: 1,
      }
    },
  };

  render() {
    let {name, ...props} = this.props;
    let {Root} = this.stylesheet;
    return (
      <Root {...props} role="button">
        <Icon
          name={name}
          aria-hidden={false}
          className={this.theme.self}
          />
      </Root>
    );
  }
}
