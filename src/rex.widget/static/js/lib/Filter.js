/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React             = require('react/addons');
var {cloneWithProps}  = React.addons;
var {Box}             = require('./layout');
var emptyFunction     = require('./emptyFunction');

var Filter = React.createClass({

  render() {
    var {property, filter, value, ...props} = this.props;
    filter = cloneWithProps(filter, {
      value: value,
      onValue: this.onValue
    });
    return (
      <Box {...props}>
        {filter}
      </Box>
    );
  },

  getDefaultProps() {
    return {
      onValue: emptyFunction
    };
  },

  onValue(value) {
    this.props.onValue(this.props.property, value);
  }

});

module.exports = Filter;
