/**
 * @copyright 2014, Prometheus Research, LLC
 */
'use strict';

var React   = require('react/addons');
var cx      = React.addons.classSet;
var Element = require('./layout/Element');

var Tab = React.createClass({

  render() {
    var {tabs, size, className, children, ...props} = this.props;
    return (
      <Element {...props}
        size={size}
        title={undefined}
        id={undefined}
        className={cx('rw-Tab', className)}>
        {children}
      </Element>
    );
  },

  getDefaultProps() {
    return {size: 1};
  }
});

module.exports = Tab;
