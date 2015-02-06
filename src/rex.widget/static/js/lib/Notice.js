/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons');
var cx    = React.addons.classSet;
var {Box} = require('./layout');

var Notice = React.createClass({

  render() {
    var {text, className, ...props} = this.props;
    className = cx(className, 'rw-Notice');
    return (
      <Box {...props} style={{alignItems: 'center', justifyContent: 'center'}} size={1} className={className}>
        <Box>{text}</Box>
      </Box>
    );
  }

});

module.exports = Notice;
