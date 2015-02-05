/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React         = require('react');
var merge         = require('../merge');
var {VBox, HBox}  = require('../layout');
var Icon          = require('../Icon');
var Hoverable     = require('../Hoverable');
var theme         = require('./theme');
var StyleUtils    = require('./StyleUtils');
var WidgetList    = require('./WidgetList');

var SearchInputClearButton = React.createClass({
  mixins: [Hoverable],

  style: {
    cursor: 'pointer',
    opacity: 0.3
  },

  styleOnHover: {
    opacity: 1
  },

  render() {
    var {style, ...props} = this.props;
    var {hover} = this.state;
    return (
      <VBox
        {...props}
        {...this.hoverable}
        style={merge(this.style, style, hover && this.styleOnHover)}
        role="button">
        ✖
      </VBox>
    );
  }
});

var SearchInput = React.createClass({

  styleInput: {
    border: 'none',
    outline: 'none'
  },

  styleButton: {
    top: 2
  },

  render() {
    var {value, onChange, placeholder, ...props} = this.props;
    return (
      <HBox {...props} onChange={undefined}>
        <VBox size={1}>
          <input
            style={this.styleInput}
            value={value}
            placeholder={placeholder}
            onChange={this._onChange}
            />
        </VBox>
        {value !== '' &&
          <SearchInputClearButton
            style={this.styleButton}
            onClick={this._clear}
            />}
      </HBox>
    );
  },

  _clear() {
    this.props.onChange('');
  },

  _onChange(e) {
    this.props.onChange(e.target.value);
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

  onQueryChange(query) {
    this.setState({query});
  }
});

module.exports = Sidebar;
