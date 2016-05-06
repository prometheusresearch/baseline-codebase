/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import * as Stylesheet from '../../stylesheet';
import * as css from '../../css';
import {VBox} from '../../layout';
import Icon from './Icon';

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

  static stylesheet = Stylesheet.create({
    Root: {
      Component: VBox,
      justifyContent: 'center',
      width: '1em',
      height: '1em',
      opacity: 0.2,
      cursor: css.cursor.pointer,
      hover: {
        opacity: 1,
      }
    },
  });

  render() {
    let {name, icon: IconComponent, ...props} = this.props;
    let {Root} = this.constructor.stylesheet;
    IconComponent = IconComponent || Icon;
    return (
      <Root {...props} role="button">
        <IconComponent
          name={name}
          aria-hidden={false}
          />
      </Root>
    );
  }
}
