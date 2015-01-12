/**
 * @copyright 2014, Prometheus Research, LLC
 */
'use strict';

var React = require('react/addons');
var cx = React.addons.classSet;
var {constructComponent} = require('./Application');
var Element = require('./layout/Element');

var Pane = React.createClass({

  render() {
    var {panes, size, activePane, className, ...props} = this.props;
    activePane = activePane || Object.keys(panes)[0];
    return (
      <Element {...props} size={size} className={cx('rw-Pane', className)}>
        {constructComponent(panes[activePane])}
      </Element>
    );
  },

  getDefaultProps() {
    return {size: 1};
  }
});

module.exports = Pane;
