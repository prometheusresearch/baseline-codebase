/**
 * @jsx React.DOM
 */
'use strict';

var React             = require('react/addons');
var cx                = React.addons.classSet;
var cloneWithProps    = React.addons.cloneWithProps;
var merge             = require('./merge');
var emptyFunction     = require('./emptyFunction');
var ApplicationState  = require('./ApplicationState');

var Filters = React.createClass({

  propTypes: {
    title: React.PropTypes.string,
    showClearButton: React.PropTypes.bool,
    showApplyButton: React.PropTypes.bool,
    filters: React.PropTypes.array
  },

  render: function() {
    var className = cx(
      this.props.className,
      'rex-widget-Filters'
    );
    return (
      <div className={className}>
        <div className="rex-widget-Filters__header">
          <div className="rex-widget-Filters__title">
            {this.props.title}
          </div>
          {this.props.showClearButton &&
            <button
              onClick={this.onClear}
              className="rex-widget-Filters__clearButton">
              Clear filters
            </button>}
        </div>
        <div className="rex-widget-Filters__filters">
          {this.renderFilters()}
        </div>
        {this.props.showApplyButton &&
          <div className="rex-widget-Filters__footer">
            <button className="rex-widget-Filters__applyButton" onClick={this.onApply}>
              Apply
            </button>
          </div>}
      </div>
    );
  },

  renderFilters: function() {
    return React.Children.map(this.props.filters, (filter) => {
      var id = filter.props.filter.props.id;
      return cloneWithProps(filter, {
        key: id,
        id,
        onValue: this.onValue,
        value: this.state[id] || null
      })
    });
  },

  getDefaultProps: function() {
    return {
      title: 'Filters',
      showClearButton: true,
      showApplyButton: true
    };
  },

  getInitialState: function() {
    return this.getFilterState(this.props);
  },

  getFilterState: function(props) {
    var state = {};
    React.Children.forEach(props.filters, (filter) => {
      var key = filter.props.filter.props.id;
      state[key] = props.value[key] || null;
    });
    return state;
  },

  onApply: function() {
    this.props.onValue(this.state);
  },

  onClear: function() {
    var filters = {};
    var filterStateIDs = []

    React.Children.forEach(this.props.filters, (filter) => {
      var key = filter.props.filter.props.id;
      filterStateIDs.push(key + '.value');
      filters[key] = null;
    });

    var update = {};
    update[this.props.id + '.value'] = filters;
    filterStateIDs.forEach((id) => update[id] = null);

    this.replaceState(filters);
    ApplicationState.updateMany(update);
  },

  onValue: function(id, value, update) {
    var nextState = this.updatedState(id, value);

    if (!this.props.showApplyButton) {
      ApplicationState.updateMany(merge(
        update,
        this.props.onValue.produce(nextState)
      ));
    }

    this.setState(nextState);
  },

  updatedState: function(id, value) {
    var update = {};
    update[id] = value || null;
    return merge(this.state, update);
  }
});

module.exports = Filters;
