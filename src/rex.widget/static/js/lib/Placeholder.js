/**
 * @jsx React.DOM
 */
'use strict';

var React   = require('react/addons');
var {Box}   = require('./layout');
var runtime = require('./runtime');

var Placeholder = React.createClass({

  render() {
    var {states, children, placeholder, size, ...props} = this.props;
    var showChildren = states.every(id => runtime.ApplicationState.getValue(id).value != null);
    return (
      <Box {...props} size={size}>
        {showChildren ? children : placeholder}
      </Box>
    );
  },

  getDefaultProps() {
    return {size: 1};
  }

});

module.exports = Placeholder;
