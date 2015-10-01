/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import {Themeable}        from 'rethemeable';
import cx                 from 'classnames';
import Icon               from './Icon';
import resolveURL         from './resolveURL';
import qs                 from './qs';
import Style              from './Button.style';

@Themeable
/**
 * May be rendered as an <a> or a <button>.
 *
 * May consist of an Icon, children or text, another Icon (rightIcon).
 *
 * @public
 */
export default class Button extends React.Component {

  static defaultTheme = Style;

  static propTypes = {
    /**
     * When true include class rw-Button--link.
     * If both **link** and **success** are false, 
     * class rw-Button--default is included. 
     */
    link: PropTypes.bool,

    /**
     * When true include class rw-Button--success. 
     * If both **link** and **success** are false, 
     * class rw-Button--default is included. 
     */
    success: React.PropTypes.bool,

    /**
     * When true include class rw-Button--danger. 
     */
    danger: React.PropTypes.bool,

    /**
     * When true include class rw-Button--quiet. 
     */
    quiet: React.PropTypes.bool,

    /**
     * One of "small", "extra-small".
     */
     size: PropTypes.oneOf(['small', 'extra-small']),

    /**
     * The textAlign attribute for the style attribute. 
     * One of "left", "right", "center".
     */
    align: PropTypes.oneOf(['left', 'right', 'center']),

    /**
     * The name of a (css) class to include.
     */
    className: PropTypes.string,

    /**
     * The (css) style attribute for this component.
     * Note that the textAlign attribute of 
     * the style attribute is set by **align**.
     */
    style: PropTypes.object,
    
    /**
     * The name of the icon to use.
     */
    icon: PropTypes.string,

    /**
     * The name of the icon displayed to the right of **icon**.
     */
    iconRight: PropTypes.string,

    /**
     * The href attribute (URL) for this anchor.
     * When href is given, the component is rendered as <a>
     * otherwise it is rendered as <button>.
     */
    href: PropTypes.string,

    /**
     * Contains the parameters for the URL.
     * The object is completely flattened into a string which is 
     * the URL query string.  
     */
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

    if (href) {
      href = resolveURL(href);
      if (params) {
        href = href + '?' + qs.stringify(params);
      }
    }

    className = cx(className, {
      [this.theme.self]: true,

      [this.theme.onDefault]: !link && !success && !danger && !quiet,
      [this.theme.onSuccess]: success,
      [this.theme.onDanger]: danger,
      [this.theme.onLink]: link,
      [this.theme.onQuiet]: quiet,

      [this.theme.onSmall]: size === 'small',
      [this.theme.onExtraSmall]: size === 'extra-small'
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
