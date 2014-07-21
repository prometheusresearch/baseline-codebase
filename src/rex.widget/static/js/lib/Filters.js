/**
 * Filters panel
 *
 * @jsx React.DOM
 */
'use strict';

var React             = require('react/addons');
var cx                = React.addons.classSet;
var cloneWithProps    = React.addons.cloneWithProps;
var merge             = require('./merge');
var emptyFunction     = require('./emptyFunction');
var chainFunction     = require('./chainFunction');
var ApplicationState  = require('./ApplicationState');

var Filters = React.createClass({

  propTypes: {
    title: React.PropTypes.string,
    showClearButton: React.PropTypes.bool,
    showApplyButton: React.PropTypes.bool,
    filters: React.PropTypes.renderable
  },

  render: function() {
    var className = cx(
      this.props.className,
      'rex-widget-Filters'
    );
    return (
      <div className={className}>
        <div>
          <div className="rex-widget-Filters__title">
            {this.props.title}
          </div>
          <div>
            {this.props.showClearButton &&
              <button
                onClick={this.onClear}
                className="rex-widget-Filters__clearButton">
                Clear filters
              </button>}
          </div>
        </div>
        <div className="rex-widget-Filters__filters">
          {this.renderFilters()}
        </div>
        {this.props.showApplyButton && <button onClick={this.onApply}>Apply</button>}
      </div>
    );
  },

  renderFilters: function() {
    var filters = [];

    React.Children.forEach(this.props.filters, (filter, idx) => {
      var key = filter.props.id || idx;
      filters.push(cloneWithProps(filter, {
        key,
        onValue: chainFunction(this.onValue.bind(null, key), filter.props.onValue),
        value: this.state[key] || null
      }));
    });

    return filters;
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
      var key = filter.props.id;
      state[key] = props.value[key] || null;
    });
    return state;
  },

  onApply: function() {
    this.props.onValue(this.state);
  },

  onClear: function() {
    var filters = {};
    React.Children.forEach(this.props.filters, (filter) => {
      var key = filter.props.id;
      filters[key] = null;
    });
    this.replaceState(filters);

    var update = {};
    update[this.props.id + '.value'] = filters;
    this.props.filterStateIds.forEach((id) => update[id] = null);
    ApplicationState.updateMany(update);
  },

  onValue: function(name, value) {
    var filters = {};
    filters[name] = value || null;
    filters = merge(this.state, filters);

    if (!this.props.showApplyButton) {
      this.props.onValue(filters);
    }

    this.setState(filters);
  }
});

module.exports = Filters;
