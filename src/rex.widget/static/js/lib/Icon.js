/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react/addons');
var cx        = React.addons.classSet;
var PropTypes = React.PropTypes;

var Icon = React.createClass({

  propTypes: {
    name: PropTypes.string.isRequired
  },

  render() {
    var className = cx('glyphicon', `glyphicon-${this.props.name}`, this.props.className);
    return <i className={className} />;
  }
});

module.exports = Icon;
