/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React         = require('react');
var merge         = require('../merge');
var {VBox}        = require('../layout');
var theme         = require('./theme');
var StyleUtils    = require('./StyleUtils');
var WidgetList    = require('./WidgetList');

var SearchInput = React.createClass({

  styleInput: {
    border: 'none',
    outline: 'none'
  },

  render() {
    var {value, onChange, placeholder, ...props} = this.props;
    return (
      <VBox {...props}>
        <input
          style={this.styleInput}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          />
      </VBox>
    );
  }
});

var Sidebar = React.createClass({

  styleSearchInput: {
    fontSize: '90%',
    padding: '2px 4px',
    boxShadow: StyleUtils.boxShadow(0, 0, 2, 0, theme.colors.shadow)
  },

  render() {
    var {widgets, onSelect, selectedWidget, style, ...props} = this.props;
    var {query} = this.state;
    if (query !== '') {
      var queryRe = new RegExp(query, 'i');
      widgets = widgets.filter(w => queryRe.exec(w.name));
    }
    return (
      <VBox {...props} style={merge(this.style, style)} height="100%">
        <SearchInput
          value={query}
          onChange={this.onQueryChange}
          style={this.styleSearchInput}
          placeholder="Search widgets..."
          />
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
