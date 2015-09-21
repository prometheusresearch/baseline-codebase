/**
 * @copyright 2014, Prometheus Research, LLC
 */
'use strict';

var React = require('react');
var cx    = require('classnames');
var {Box} = require('./Layout');

/**
 * @deprecated
 * @public
 */
var Tab = React.createClass({

  render() {
    var {tabs, size, className, children, ...props} = this.props;
    return (
      <Box {...props}
        size={size}
        title={undefined}
        id={undefined}
        className={cx('rw-Tab', className)}>
        {children}
      </Box>
    );
  },

  getDefaultProps() {
    return {size: 1};
  }
});

module.exports = Tab;
