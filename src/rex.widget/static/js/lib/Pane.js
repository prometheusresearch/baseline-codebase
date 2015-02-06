/**
 * @copyright 2014, Prometheus Research, LLC
 */
'use strict';

var React                 = require('react/addons');
var cx                    = React.addons.classSet;
var {constructComponent}  = require('./Application');
var {Box}                 = require('./layout');

var Pane = React.createClass({

  render() {
    var {panes, size, activePane, className, ...props} = this.props;
    activePane = activePane || Object.keys(panes)[0];
    return (
      <Box {...props} size={size} className={cx('rw-Pane', className)}>
        {constructComponent(panes[activePane])}
      </Box>
    );
  },

  getDefaultProps() {
    return {size: 1};
  }
});

module.exports = Pane;
