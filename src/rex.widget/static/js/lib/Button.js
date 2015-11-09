/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import * as Stylesheet    from '@prometheusresearch/react-stylesheet';
import * as CSS           from '@prometheusresearch/react-stylesheet/css';
import Icon               from './Icon';
import resolveURL         from './resolveURL';
import * as qs            from './qs';
import Theme              from './Theme';

/**
 * May be rendered as an <a> or a <button>.
 *
 * May consist of an Icon, children or text, another Icon (rightIcon).
 *
 * @public
 */
@Stylesheet.styleable
export default class Button extends React.Component {

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

  static stylesheet = Stylesheet.createStylesheet({
    Root: {
      display: CSS.display.inlineBlock,
      marginBottom: 0,
      fontWeight: CSS.fontWeight.normal,
      textAlign: CSS.textAlign.center,
      verticalAlign: CSS.verticalAlign.middle,
      touchAction: CSS.touchAction.manipulation,
      cursor: CSS.cursor.pointer,
      backgroundImage: CSS.none,
      whiteSpace: CSS.whiteSpace.nowrap,
      padding: CSS.padding(6, 12),
      fontSize: 14,
      lineHeight: 1.428571429,
      borderRadius: 2,
      userSelect: CSS.none,
      textOverflow: CSS.textOverflow.ellipsis,
      overflow: CSS.overflow.hidden,

      focus: {
        outline: ['thin dotted', '1px auto -webkit-focus-ring-color'],
        outlineOffset: -2,
        textDecoration: CSS.none,
      },

      active: {
        outline: ['thin dotted', '1px auto -webkit-focus-ring-color'],
        outlineOffset: -2,
        textDecoration: CSS.none,
      },

      hover: {
        textDecoration: CSS.none
      },

      default: {
        color: Theme.button.textColor || '#333333',
        backgroundColor: Theme.button.backgroundColor || '#ffffff',
        borderWidth: 1,
        borderStyle: CSS.border.solid,
        borderColor: Theme.button.borderColor || '#cccccc',

        hover: {
          color: Theme.button.hover.textColor || '#333333',
          backgroundColor: Theme.button.hover.backgroundColor || '#e6e6e6',
          borderColor: Theme.button.hover.borderColor || '#adadad',
        },

        focus: {
          color: Theme.button.focus.textColor || '#333333',
          backgroundColor: Theme.button.focus.backgroundColor || '#e6e6e6',
          borderColor: Theme.button.focus.borderColor || '#8c8c8c',
        },

        active: {
          color: Theme.button.active.textColor || '#333333',
          backgroundColor: Theme.button.active.backgroundColor || '#d4d4d4',
          borderColor: Theme.button.active.borderColor || '#8c8c8c',
          backgroundImage: CSS.none,
        },
      },

      success: {
        color: Theme.successButton.textColor || '#ffffff',
        backgroundColor: Theme.successButton.backgroundColor || '#5cb85c',
        borderWidth: 1,
        borderStyle: CSS.border.solid,
        borderColor: Theme.button.hover.borderColor || '#4cae4c',

        hover: {
          color: Theme.successButton.hover.textColor || '#ffffff',
          backgroundColor: Theme.successButton.hover.backgroundColor || '#449d44',
          borderColor: Theme.button.hover.borderColor || '#398439',
        },

        focus: {
          color: Theme.successButton.focus.textColor || '#ffffff',
          backgroundColor: Theme.successButton.focus.backgroundColor || '#449d44',
          borderColor: Theme.button.hover.borderColor || '#398439',
        },

        active: {
          color: Theme.successButton.active.textColor || '#ffffff',
          backgroundColor: Theme.successButton.active.backgroundColor || '#398439',
          borderColor: Theme.button.hover.borderColor || '#255625',
        },
      },

      danger: {
        color: Theme.dangerButton.textColor || '#ffffff',
        backgroundColor: Theme.dangerButton.backgroundColor || '#d9534f',
        borderWidth: 1,
        borderStyle: CSS.border.solid,
        borderColor: Theme.button.hover.borderColor || '#d43f3a',

        hover: {
          color: Theme.dangerButton.hover.textColor || '#ffffff',
          backgroundColor: Theme.dangerButton.hover.backgroundColor || '#c9302c',
          borderColor: Theme.button.hover.borderColor || '#ac2925',
        },

        focus: {
          color: Theme.dangerButton.focus.textColor || '#ffffff',
          backgroundColor: Theme.dangerButton.hover.backgroundColor || '#c9302c',
          borderColor: Theme.button.hover.borderColor || '#761c19',
        },

        active: {
          color: Theme.dangerButton.active.textColor || '#ffffff',
          backgroundColor: Theme.dangerButton.active.backgroundColor || '#ac2925',
          borderColor: Theme.button.hover.borderColor || '#761c19',
        },
      },

      link: {
        borderColor: CSS.color.transparent,
        backgroundColor: CSS.color.transparent,
        boxShadow: CSS.none,
        color: '#428bca',
        fontWeight: CSS.fontWeight.normal,
        borderRadius: 0,

        hover: {
          color: '#2a6496',
          textDecoration: CSS.textDecoration.underline,
        },
      },

      quiet: {
        background: Theme.quietButton.backgroundColor || CSS.color.transparent,
        color: Theme.quietButton.textColor || '#888888',
        borderWidth: 1,
        borderStyle: CSS.border.solid,
        borderColor: Theme.quietButton.borderColor || CSS.color.transparent,

        hover: {
          color: Theme.dangerButton.hover.textColor || '#888888',
          backgroundColor: Theme.dangerButton.hover.backgroundColor || '#e6e6e6',
          borderColor: Theme.button.hover.borderColor || CSS.color.transparent,
        },

        active: {
          color: Theme.dangerButton.hover.textColor || '#888888',
          backgroundColor: Theme.dangerButton.hover.backgroundColor || '#e6e6e6',
          borderColor: Theme.button.hover.borderColor || CSS.color.transparent,
        },

        focus: {
          color: Theme.dangerButton.hover.textColor || '#888888',
          backgroundColor: Theme.dangerButton.hover.backgroundColor || '#e6e6e6',
          borderColor: Theme.button.hover.borderColor || CSS.color.transparent,
        },

      },

      small: {
        padding: CSS.padding(5, 10),
        fontSize: 12,
        lineHeight: 1.5,
        borderRadius: 2,
      },

      extraSmall: {
        padding: CSS.padding(1, 5),
        fontSize: 12,
        lineHeight: 1.5,
        borderRadius: 2,
      },
    }
  });

  render() {
    let {
      link, success, danger, quiet, size, align,
      className, style,
      icon, iconRight,
      text,
      children = this.props.text,
      href, params,
      ...props
    } = this.props;

    if (href) {
      href = resolveURL(href);
      if (params) {
        href = href + '?' + qs.stringify(params);
      }
    }

    if (align) {
      style = {...style, textAlign: align};
    }

    let Component = href ? 'a' : 'button';

    let {Root} = this.stylesheet;
    return (
      <Root
        {...props}
        Component={Component}
        state={{
          success, danger, link, quiet,
          small: size === 'small',
          extraSmall: size === 'extraSmall',
          default: !link && !danger && !success,
        }}
        href={href}
        style={style}
        className={className}>
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
      </Root>
    );
  }
}
