/**
 * @jsx React.DOM
 */
'use strict';

var React           = require('react/addons');
var PropTypes       = React.PropTypes;
var cx              = React.addons.classSet;
var emptyFunction   = require('./emptyFunction');
var merge           = require('./merge');
var PageStateMixin  = require('./PageStateMixin');

var Tabs = React.createClass({

  mixins: [PageStateMixin],

  propTypes: {
    tabs: PropTypes.renderable,
    active: PropTypes.number
  },

  render() {
    var tabs = [];
    var panes = [];
    var active = this.getActive();

    React.Children.forEach(this.props.tabs, (tab, idx) => {
      idx = idx + 1;
      var isActive = idx === active;

      var tabClassName = cx({
        'rex-widget-Tabs__tab': true,
        'rex-widget-Tabs__tab--active': isActive,
        'active': isActive
      });
      tabs.push(
        <li key={idx}>
          <a
            onClick={this.onClick.bind(null, idx)}
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

  getDefaultProps() {
    return {
      active: 1,
      onActive: emptyFunction
    };
  },

  getInitialState() {
    return merge({active: null}, this.getPageState());
  },

  getActive() {
    return this.state.active !== null ?
      this.state.active :
      this.props.active;
  },

  setActive(active) {
    this.setState({active});
    this.setPageState({active});
  },

  onClick(active, e) {
    e.preventDefault();
    this.setActive(active);
  }
});

module.exports = Tabs;

