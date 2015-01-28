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
    var {property, filter, ...props} = this.props;
    filter = cloneWithProps(filter, {
      onValue: this.onValue.bind(null, filter.props.onValue)
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

  onValue(onValue, value) {
    if (onValue) {
      onValue(value);
    }
    this.props.onValue(value);
  }

});

module.exports = Filter;
