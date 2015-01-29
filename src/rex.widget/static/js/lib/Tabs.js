/**
 * @copyright 2014, Prometheus Research, LLC
 */
'use strict';

var React   = require('react/addons');
var cx      = React.addons.classSet;
var Box     = require('./layout/Box');

var Tabs = React.createClass({

  render() {
    var {tabs, size, className, active, ...props} = this.props;
    active = active || tabs[0].props.id;
    var buttons = tabs.map(tab =>
      <li
        role="presentation"
        className={cx({
          active: tab.props.id === active,
          disabled: tab.props.disabled
        })}>
        <a
          href="#"
          onClick={this.onClick.bind(null, tab.props.id)}>
          {tab.props.title || tab.props.id}
        </a>
      </li>
    );
    var tab = tabs.filter(tab => tab.props.id === active)[0];
    return (
      <Box {...props} size={size} className={cx('rw-Tabs', className)}>
        <ul className="rw-Tabs__buttons nav nav-tabs">
          {buttons}
        </ul>
        <Box className="rw-Tabs__children">
          {tab}
        </Box>
      </Box>
    );
  },

  getDefaultProps() {
    return {size: 1};
  },

  onClick(id, e) {
    e.preventDefault();
    this.props.onActive(id);
  }
});

module.exports = Tabs;
