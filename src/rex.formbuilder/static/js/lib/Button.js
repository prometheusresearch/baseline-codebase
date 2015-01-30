/** @jsx React.DOM */
'use strict';

var React = require('react/addons');
var cx = React.addons.classSet;

var Button = React.createClass({

  getDefaultProps: function () {
    return {
      href: null,
      style: 'default',
      onClick: null,
      disabled: false,
      target: null,
    };
  },

  getInitialState: function () {
    return {
      disabled: false
    }
  },

  isDisabled: function () {
    return this.props.disabled || this.state.disabled;
  },

  enable: function (doEnable) {
    this.setState({
      disabled: !doEnable,
    });
  },

  render: function () {
    var classSet = {'btn': true};
    classSet['btn-' + this.props.style] = true;
    if (this.props.className) {
      classSet[this.props.className] = true;
    }
    if (this.props.href) {
      return (
        <a href={this.props.href}
          target={this.props.target}
          className={cx(classSet)}
          onClick={this.props.onClick}
          disabled={this.isDisabled()}
          role="button">
          {this.props.children}
        </a>
      );
    }
    else {
      return (
        <button className={cx(classSet)}
          onClick={this.props.onClick}
          disabled={this.isDisabled()}
          type="button">
          {this.props.children}
        </button>
      );
    }
  }
});

module.exports = Button;
