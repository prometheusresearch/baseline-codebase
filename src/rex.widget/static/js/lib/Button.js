/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import cx                 from 'classnames';
import Icon               from './Icon';
import emptyFunction      from './emptyFunction';
import resolveURL         from './resolveURL';
import qs                 from './qs';
import Style              from './Button.module.css';

/**
 * Button.
 *
 * @public
 */
export default class Button extends React.Component {

  static propTypes = {
    link: PropTypes.bool,
    success: PropTypes.bool,
    danger: PropTypes.bool,
    quiet: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'extra-small']),
    align: PropTypes.oneOf(['left', 'right']),
    className: PropTypes.string,
    style: PropTypes.object,
    icon: PropTypes.string,
    iconRight: PropTypes.string,
    href: PropTypes.string,
    params: PropTypes.object
  };

  static defaultProps = {
    type: 'button'
  };

  render() {
    let {
      link, success, danger, quiet, size, align,
      className, style,
      icon, iconRight,
      text, children,
      href, params,
      ...props
    } = this.props;

    if (href && params) {
      href = href + '?' + qs.stringify(params);
    }

    className = cx(className, {
      [Style.self]: true,
      [Style.isDefault]: !link && !success && !danger && !quiet,
      [Style.isSuccess]: success,
      [Style.isDanger]: danger,
      [Style.isLink]: link,
      [Style.isQuiet]: quiet,
      [Style.isSmall]: size === 'small',
      [Style.isExtraSmall]: size === 'extra-small'
    });

    if (align) {
      style = {...style, textAlign: align};
    }

    children = children || text || null;

    let Component = href ? 'a' : 'button';

    return (
      <Component {...props} href={href} style={style} className={className}>
        {icon &&
          <Icon
            name={icon}
            style={{marginRight: children || iconRight ? 10 : 0}}
            />}
        {children}
        {iconRight &&
          <Icon
            name={iconRight}
            style={{marginLeft: children ? 10 : 0}}
            />}
      </Component>
    );
  }
}
