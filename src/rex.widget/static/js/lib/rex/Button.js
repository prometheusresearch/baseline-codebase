/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons');
var cx    = React.addons.classSet;
var Icon  = require('../Icon');

var Button = React.createClass({
  
  propTypes: {
    onClick: React.PropTypes.func,
    link: React.PropTypes.bool,
    success: React.PropTypes.bool,
    icon: React.PropTypes.string,
    label: React.PropTypes.string
  },

  render: function() {
    var {link, primary, success, size} = this.props;
    var className = cx({
      'rw-Button': true,
      'btn': true,
      'btn-default': !primary && !link && !success,
      'btn-primary': primary,
      'btn-success': success,
      'btn-link': link
    });
    className = cx(className, size && `btn-${size}`);
    return (
      <button
        disabled={this.props.disabled}
        className={cx(className, this.props.className)}
        placeholder={this.props.placeholder}
        onClick={this.onClick}
        id={this.props.id}>
        {this.props.icon &&
          <Icon className="rw-Button__icon" name={this.props.icon} />}
        {this.props.children || this.props.label}
      </button>
    );
  },

  onClick: function(e) {
    if (this.props.href) {
      window.location = this.props.href;
    } else if (this.props.onClick) {
      var id = e.target.id;
      this.props.onClick(id);
    }
  }

});

module.exports = Button;
