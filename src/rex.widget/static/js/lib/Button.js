/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons');
var cx    = React.addons.classSet;
var Icon  = require('./Icon');

var Button = React.createClass({
  
  propTypes: {
    onClick: React.PropTypes.func,
    link: React.PropTypes.bool,
    success: React.PropTypes.bool,
    icon: React.PropTypes.string
  },

  render: function() {
    var className = cx({
      'rex-widget-Button': true,
      'rex-widget-Button--default': !this.props.link && !this.props.success,
      'rex-widget-Button--success': this.props.success,
      'rex-widget-Button--link': this.props.link
    });
    return (
      <button
        disabled={this.props.disabled}
        className={cx(className, this.props.className)}
        placeholder={this.props.placeholder}
        onClick={this.onClick}
        id={this.props.id}>
        {this.props.icon && <Icon name={this.props.icon} />}
        {this.props.children}
      </button>
    );
  },

  onClick: function(e) {
    var id = e.target.id;
    this.props.onClick(id);
  }

});

module.exports = Button;
