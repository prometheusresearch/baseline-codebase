/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import * as Stylesheet    from '@prometheusresearch/react-stylesheet';
import Icon               from './Icon';
import resolveURL         from './resolveURL';
import * as qs            from './qs';
import * as Style         from './StyleUtils';

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
      display: Style.display.inlineBlock,
      marginBottom: 0,
      fontWeight: Style.fontWeight.normal,
      textAlign: Style.textAlign.center,
      verticalAlign: Style.verticalAlign.middle,
      touchAction: Style.touchAction.manipulation,
      cursor: Style.cursor.pointer,
      backgroundImage: Style.none,
      whiteSpace: Style.whiteSpace.nowrap,
      padding: Style.padding(6, 12),
      fontSize: 14,
      lineHeight: 1.428571429,
      borderRadius: 2,
      userSelect: Style.none,
      textOverflow: Style.textOverflow.ellipsis,
      overflow: Style.overflow.hidden,

      focus: {
        outline: ['thin dotted', '1px auto -webkit-focus-ring-color'],
        outlineOffset: -2,
        textDecoration: Style.none,
      },

      active: {
        outline: ['thin dotted', '1px auto -webkit-focus-ring-color'],
        outlineOffset: -2,
        textDecoration: Style.none,
      },

      hover: {
        textDecoration: Style.none
      },

      default: {
        color: '#333333',
        backgroundColor: '#ffffff',
        border: '1px solid #cccccc',

        hover: {
          color: '#333333',
          backgroundColor: '#e6e6e6',
          borderColor: '#adadad',
        },

        focus: {
          color: '#333333',
          backgroundColor: '#e6e6e6',
          borderColor: '#8c8c8c',
        },

        active: {
          color: '#333333',
          backgroundColor: '#d4d4d4',
          borderColor: '#8c8c8c',
          backgroundImage: Style.none,
        },
      },

      success: {
        color: '#ffffff',
        backgroundColor: '#5cb85c',
        border: Style.border(1, Style.borderStyle.solid, '#4cae4c'),

        hover: {
          color: '#ffffff',
          backgroundColor: '#449d44',
          borderColor: '#398439',
        },

        focus: {
          color: '#ffffff',
          backgroundColor: '#449d44',
          borderColor: '#398439',
        },

        active: {
          color: '#ffffff',
          backgroundColor: '#398439',
          borderColor: '#255625',
        },
      },

      danger: {
        color: '#ffffff',
        backgroundColor: '#d9534f',
        border: Style.border(1, Style.borderStyle.solid, '#d43f3a'),

        hover: {
          color: '#ffffff',
          backgroundColor: '#c9302c',
          borderColor: '#ac2925',
        },

        focus: {
          color: '#ffffff',
          backgroundColor: '#c9302c',
          borderColor: '#761c19',
        },

        active: {
          color: '#ffffff',
          backgroundColor: '#ac2925',
          borderColor: '#761c19',
        },
      },

      link: {
        borderColor: Style.color.transparent,
        backgroundColor: Style.color.transparent,
        boxShadow: Style.none,
        color: '#428bca',
        fontWeight: Style.fontWeight.normal,
        borderRadius: 0,

        hover: {
          color: '#2a6496',
          textDecoration: Style.textDecoration.underline,
        },
      },

      quiet: {
        background: Style.color.transparent,
        color: '#888',
        border: Style.border(1, Style.borderStyle.solid, Style.color.transparent),

        hover: {
        },

        active: {
        },
      },

      small: {
        padding: Style.padding(5, 10),
        fontSize: 12,
        lineHeight: 1.5,
        borderRadius: 2,
      },

      extraSmall: {
        padding: Style.padding(1, 5),
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
