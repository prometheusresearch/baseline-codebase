/**
 * @jsx React.DOM
 */
'use strict';

var React         = require('react/addons');
var cx            = React.addons.classSet;
var Icon          = require('./Icon');
var emptyFunction = require('./emptyFunction');
var $             = require('jquery');

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
      link, success, danger, quiet, size, className, disabled,
      placeholder, id, icon, iconRight, text, children, ...props
    } = this.props;
    var classNames = cx({
      'rw-Button': true,
      'rw-Button--default': !link && !success,
      'rw-Button--success': success,
      'rw-Button--danger': danger,
      'rw-Button--link': link,
      'rw-Button--quiet': quiet,
      'rw-Button--small': size === 'small',
      'rw-Button--extraSmall': size === 'extra-small'
    });
    return (
      <button
        {...props}
        title={children || text}
        disabled={disabled}
        className={cx(classNames, className)}
        placeholder={placeholder}
        id={id}>
        {icon &&
          <Icon
            name={icon}
            style={{marginRight: children || text || iconRight ? 10 : 0}}
            />}
        {children || text}
        {iconRight &&
          <Icon
            name={iconRight}
            style={{marginLeft: children || text ? 10 : 0}}
            />}
      </button>
    );
  },

  getDefaultProps() {
    return {onClick: emptyFunction};
  }

});

module.exports = Button;
