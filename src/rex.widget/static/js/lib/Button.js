/**
 * @jsx React.DOM
 */
'use strict';

var React                 = require('react/addons');
var cx                    = React.addons.classSet;
var Icon                  = require('./Icon');
var emptyFunction         = require('./emptyFunction');
var $                     = require('jquery');
var qs                    = require('./qs');
var renderTemplatedString = require('./renderTemplatedString');

var Button = React.createClass({

  propTypes: {
    onClick: React.PropTypes.func,
    link: React.PropTypes.bool,
    success: React.PropTypes.bool,
    danger: React.PropTypes.bool,
    icon: React.PropTypes.string
  },

  render() {
    var {
      link, success, danger, quiet, size, className, style, disabled, align,
      placeholder, id, icon, iconRight, text, children, href, params, ...props
    } = this.props;
    if (href && params) {
      href = href + '?' + qs.stringify(params);
    }
    var classNames = cx({
      'btn': true,
      'rw-Button': true,
      'rw-Button--default': !link && !success,
      'rw-Button--success': success,
      'rw-Button--danger': danger,
      'rw-Button--link': link,
      'rw-Button--quiet': quiet,
      'rw-Button--small': size === 'small',
      'rw-Button--extraSmall': size === 'extra-small'
    });
    var Component = href ? 'a' : 'button';
    return (
      <Component
        {...props}
        href={href}
        style={{...style, textAlign: align ? align : undefined}}
        //title={children || text}
        disabled={disabled}
        className={cx(classNames, className)}
        placeholder={placeholder}
        id={id}>
        {icon &&
          <Icon
            name={icon}
            style={{marginRight: children || text || iconRight ? 10 : 0}}
            />}
        {children ? children : text ? renderTemplatedString(text) : null}
        {iconRight &&
          <Icon
            name={iconRight}
            style={{marginLeft: children || text ? 10 : 0}}
            />}
      </Component>
    );
  },

  getDefaultProps() {
    return {
      onClick: emptyFunction,
      type: 'button'
    };
  }

});

module.exports = Button;
