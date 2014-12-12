/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons');
var cx    = React.addons.classSet;

var Icon = React.createClass({

  propTypes: {
    name: React.PropTypes.string.isRequired,
    animate: React.PropTypes.bool
  },

  render() {
    var {name, animate} = this.props;
    var className = cx(
      'glyphicon',
      `glyphicon-${name}`,
      animate && `glyphicon-${name}-animate`
    );
    return <span className={className} />;
  }
});

module.exports = Icon;
