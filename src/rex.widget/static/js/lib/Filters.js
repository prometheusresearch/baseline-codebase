/**
 * @jsx React.DOM
 */
'use strict';

var React             = require('react/addons');
var PropTypes         = React.PropTypes;
var cx                = React.addons.classSet;
var cloneWithProps    = React.addons.cloneWithProps;
var merge             = require('./merge');
var emptyFunction     = require('./emptyFunction');
var ApplicationState  = require('./ApplicationState');
var Panel             = require('./Panel');

var Filters = React.createClass({

  propTypes: {
    title: PropTypes.string,
    showClearButton: PropTypes.bool,
    showApplyButton: PropTypes.bool,
    filters: PropTypes.array
  },

  render() {
    var className = cx(
      this.props.className,
      'rex-widget-Filters',
      this.props.inline && 'rex-widget-Filters--inline'
    );
    return (
      <Panel
        inline={this.props.inline}
        className={className}
        title={this.props.title}
        headerToolbar={this.props.showClearButton && !this.props.inline &&
          <button
            onClick={this.onClear}
            className="rex-widget-Filters__clearButton">
            <i className="glyphicon glyphicon-remove" />
            <span className="rex-widget-Filters__clearButtonText">Clear filters</span>
          </button>}
        footerToolbar={
          <div key="applyButton" className="rex-widget-Filters__footer">
            {this.props.showApplyButton &&
              <button className="rex-widget-Filters__applyButton" onClick={this.onApply}>
                Apply
              </button>}
            {this.props.showClearButton && this.props.inline &&
              <button
                onClick={this.onClear}
                className="rex-widget-Filters__clearButton">
                <i className="glyphicon glyphicon-remove" />
                <span className="rex-widget-Filters__clearButtonText">Clear filters</span>
              </button>}
          </div>}>
          <div onKeyPress={this.props.showApplyButton && this.onKeyPress}>
            <this.renderFilters />
          </div>
      </Panel>
    );
  },

  renderFilters() {
    return React.Children.map(this.props.filters, (filter) => {
      var id = filter.props.filter.props.id;
      return cloneWithProps(filter, {
        key: id,
        id,
        onValue: this.onValue,
        inline: this.props.inline,
        amortizationEnabled: !this.props.showApplyButton
      })
    });
  },

  getDefaultProps() {
    return {
      title: null,
      showClearButton: true,
      showApplyButton: true
    };
  },

  getFilterState(props) {
    props = props || this.props;
    var state = {};
    React.Children.forEach(props.filters, (filter) => {
      var key = filter.props.filter.props.id;
      state[key] = props.value[key] || null;
    });
    return state;
  },

  onKeyPress(e) {
    if (e.key === 'Enter') {
      this.onApply();
    }
  },

  onApply() {
    var state = this.getFilterState();
    React.Children.forEach(this.props.filters, (filter) => {
      var key = filter.props.filter.props.id;
      state[key] = ApplicationState.get(key + '/value');
    });
    this.props.onValue(state);
  },

  onClear() {
    var filters = {};
    var filterStateIDs = []

    React.Children.forEach(this.props.filters, (filter) => {
      var key = filter.props.filter.props.id;
      filterStateIDs.push(key + '/value');
      filters[key] = null;
    });

    var update = {};
    update[this.props.id + '/value'] = filters;
    filterStateIDs.forEach((id) => update[id] = null);

    this.replaceState(filters);
    ApplicationState.updateMany(update);
    ApplicationState.history.pushState();
  },

  onValue(id, value, update) {
    var nextState = this.updatedState(id, value);

    if (!this.props.showApplyButton) {
      ApplicationState.updateMany(merge(
        update,
        this.props.onValue.produce(nextState)
      ));
      ApplicationState.history.pushState();
    } else {
      ApplicationState.updateMany(update);
    }
  },

  updatedState(id, value) {
    var update = {};
    update[id] = value || null;
    return merge(this.getFilterState(), update);
  }
});

module.exports = Filters;
