/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React         = require('react');
var {VBox}        = require('../layout');
var WidgetList    = require('./WidgetList');

var Sidebar = React.createClass({

  render() {
    var {widgets, onSelect, selectedWidget, ...props} = this.props;
    var {query} = this.state;
    if (query !== '') {
      var queryRe = new RegExp(query, 'i');
      widgets = widgets.filter(w => queryRe.exec(w.name));
    }
    return (
      <VBox {...props} style={this.style} height="100%">
        <VBox>
          <input
            value={query}
            onChange={this.onQueryChange}
            />
        </VBox>
        <WidgetList
          size={1}
          selectedWidget={selectedWidget}
          widgets={widgets}
          onSelect={onSelect}
          />
      </VBox>
    );
  },

  getInitialState() {
    return {query: ''};
  },

  onQueryChange(e) {
    var query = e.target.value;
    this.setState({query});
  }
});

module.exports = Sidebar;
