/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react/addons');
var PropTypes = React.PropTypes;
var cx        = React.addons.classSet;

var Tabs = React.createClass({

  propTypes: {
    tabs: PropTypes.renderable,
    active: PropTypes.number
  },

  render: function() {
    var active = this.state.active || 1;
    var tabs = [];
    var panes = [];

    React.Children.forEach(this.props.tabs, (tab, idx) => {
      idx = idx + 1;
      var isActive = idx === active;

      var tabClassName = cx({
        'rex-widget-Tabs__tab': true,
        'rex-widget-Tabs__tab--active': isActive,
        'active': isActive
      });
      console.log(idx);
      tabs.push(
        <li key={idx}>
          <a
            onClick={this.activate.bind(null, idx)}
            className={tabClassName} href="#" role="tab">
            {tab.props.title}
          </a>
        </li>
      );

      var paneClassName = cx({
        'rex-widget-Tabs__tabPane': true,
        'rex-widget-Tabs__tabPane--active': isActive,
        'tab-pane': true,
        'active': isActive
      });
      panes.push(
        <div key={idx} className={paneClassName}>{tab}</div>
      );
    });

    return this.transferPropsTo(
      <div className="rex-widget-Tabs">
        <ul className="rex-widget-Tabs__tabs nav nav-tabs" role="tablist">
          {tabs}
        </ul>
        <div className="rex-widget-Tabs__content tab-content">
          {panes}
        </div>
      </div>
    );
  },

  getInitialState: function() {
    return {active: this.props.active || 1};
  },

  activate: function(active) {
    this.setState({active});
  }
});

module.exports = Tabs;

