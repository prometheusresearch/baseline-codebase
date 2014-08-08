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

var RowFilters = React.createClass({

  propTypes: {
    showClearButton: React.PropTypes.bool,
    showApplyButton: React.PropTypes.bool,
    filters: React.PropTypes.array
  },

  render: function() {
    var className = cx(
      this.props.className,
      'rex-widget-RowFilters'
    );
    return (
      <div className="rex-widget-RowFilters">
        <div className="rex-widget-RowFilters__children">
          {this.renderFilters()}
          <span className="rex-widget-RowFilters__buttonList">
            <button className="rex-widget-RowFilters__applyButton" onClick={this.onApply}>
              Apply
            </button>
            {this.props.showClearButton &&
            <button
              onClick={this.onClear}
              className="rex-widget-RowFilters__clearButton">
              Clear filters
            </button>}
          </span>
        </div>
      </div>
    );
  },

  renderFilters: function() {
    return React.Children.map(this.props.filters, (filter) => {
      var id = filter.props.filter.props.id;
      return cloneWithProps(filter, {
        key: id,
        id,
        onValue: this.onValue
      })
    });
  },

  getDefaultProps: function() {
    return {
      showClearButton: true,
      showApplyButton: true
    };
  },

  getFilterState: function(props) {
    props = props || this.props;
    var state = {};
    React.Children.forEach(props.filters, (filter) => {
      var key = filter.props.filter.props.id;
      state[key] = props.value[key] || null;
    });
    return state;
  },

  onApply: function() {
    var state = this.getFilterState();
    React.Children.forEach(this.props.filters, (filter) => {
      var key = filter.props.filter.props.id;
      state[key] = ApplicationState.get(key + '.value');
    });
    this.props.onValue(state);
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
    } else {
      ApplicationState.updateMany(update);
    }
  },

  updatedState: function(id, value) {
    var update = {};
    update[id] = value || null;
    return merge(this.getFilterState(), update);
  }
});

module.exports = RowFilters;
