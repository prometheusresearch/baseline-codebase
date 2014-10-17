/** @jsx React.DOM */
'use strict';

var React = require('react');
var cx = React.addons.classSet;

var ViewSource = React.createClass({

  getInitialState: function () {
    var tabs = this.props.tabs;
    return {active: tabs.length ? tabs[0].id : null};
  },

  onTabSelected: function (id) {
    this.setState({active: id});
  },

  render: function () {
    var tabs = this.props.tabs.map((tab) => {
      var classes = {
        'rfb-active': tab.id === this.state.active
      };
      return (
        <button className={cx(classes)}
           onClick={this.onTabSelected.bind(this, tab.id)}
           key={tab.id}>
          {tab.title}
        </button>
      );
    });

    var source;
    for (var i in this.props.tabs) {
      var tab = this.props.tabs[i];
      if (tab.id === this.state.active) {
        source = tab.content;
      }
    }
    return (
      <div className={cx("rfb-ViewSource", this.props.className)}>
        <pre className="rfb-ViewSource__text">
          {source}
        </pre>
        <div className="rfb-ViewSource__buttons">
          {tabs}
          <button className="rfb-ViewSource__close"
                  onClick={this.props.onClose}>&times;</button>
        </div>
      </div>
    );
  }
});

module.exports = ViewSource;
