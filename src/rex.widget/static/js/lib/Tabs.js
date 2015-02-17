/**
 * @copyright 2014, Prometheus Research, LLC
 */
'use strict';

var React       = require('react/addons');
var cx          = React.addons.classSet;
var {Box, HBox} = require('./layout');

var Tabs = React.createClass({

  render() {
    var {
      tabs, size, className, active,
      buttonsStyle, buttonsPosition, ...props
    } = this.props;
    active = active || tabs[0].props.id;
    var buttons = tabs.map(tab =>
      <li
        key={tab.props.id}
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
    className = cx('rw-Tabs', className);
    var tabs = (
      <Box className={`rw-Tabs--${buttonsPosition}Position`} key="tabs">
        <ul className={`rw-Tabs__buttons nav nav-${buttonsStyle}`}>
          {buttons}
        </ul>
      </Box>
    );
    var content = (
      <Box className="rw-Tabs__children tab-content" key="content" size={1}>
        {tab}
      </Box>
    );
    var Wrapper = buttonsPosition === 'left' || buttonsPosition === 'right' ?
      HBox : Box;
    return (
      <Wrapper {...props} size={size} className={className}>
        {buttonsPosition === 'top'    && [tabs, content]}
        {buttonsPosition === 'right'  && [content, tabs]}
        {buttonsPosition === 'bottom' && [content, tabs]}
        {buttonsPosition === 'left'   && [tabs, content]}
      </Wrapper>
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
