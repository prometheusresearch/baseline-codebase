/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var cx    = require('classnames');

var Icon = React.createClass({

  propTypes: {
    name: React.PropTypes.string.isRequired,
    className: React.PropTypes.string
  },

  render() {
    var {className, name, ...props} = this.props;
    className = cx('glyphicon', `glyphicon-${name}`, className);
    return <i {...props} aria-hidden={true} className={className} />;
  }
});

module.exports = Icon;
