/**
 * @jsx React.DOM
 */
'use strict';

var $           = require('jquery');
var _           = require('lodash');
var React       = require('react');
var cx          = React.addons.classSet;
var WidgetMixin = require('./WidgetMixin');
var lookup      = require('../lookup');


var LookupBox = React.createClass({
  propTypes: {
    lookup: React.PropTypes.string,
    apiUrl: React.PropTypes.string
  },

  getInitialState: function () {
    return {
      values: []
    };
  },

  clearValues: function () {
    this.setState({
      values: []
    });
  },

  _findValues: function (query) {
    $.ajax({
      url: this.props.apiUrl,
      data: {
        lookup: this.props.lookup,
        query
      },
      success: (data) => {
        this.setState({
          values: data.values || []
        });
      },
      error: () => {
        this.clearValues();
      }
    });
  },

  componentWillMount: function () {
    this.findValues = _.debounce(this._findValues, 500);
  },

  onSelect: function (value) {
    this.props.onChange('' + value);
    this.clearValues();
  },

  onChange: function (event) {
    if (event.target.value && this.props.apiUrl) {
      this.findValues(event.target.value);
    } else {
      this.clearValues();
    }
    this.props.onChange(event);
  },

  onBlur: function () {
    setTimeout(this.clearValues, 500);
  },

  render: function () {
    var suggestions;
    if (this.state.values.length) {
      suggestions = this.state.values.map((value, idx) => {
        return (
          <li
            key={idx}
            onClick={this.onSelect.bind(this, value.value)}>
            {value.label}
          </li>
        );
      });
    }

    return (
      <div className="rex-forms-lookupText">
        <input
          disabled={this.props.disabled}
          className={this.props.className}
          id={this.props.inputName}
          name={this.props.inputName}
          onChange={this.onChange}
          value={this.props.value}
          onBlur={this.onBlur}
          />
        {suggestions &&
          <ul className="rex-forms-lookupText__suggestions">
            {suggestions}
          </ul>
        }
      </div>
    );
  }
});


var lookupText = React.createClass({
  mixins: [
    WidgetMixin,
    lookup.LookupMixin
  ],

  propTypes: {
    inputType: React.PropTypes.string
  },

  renderInput: function() {
    var className = cx('rex-forms-inputText', this.getSize('width'));
    return (
      <LookupBox
        lookup={this.getWidgetOptions().lookup}
        apiUrl={this.getLookupApiUrl()}
        disabled={this.props.disabled}
        className={className}
        inputName={this.getInputName()}
        onChange={this.onChange}
        value={this.getValue()}
        />
    );
  }
});


module.exports = lookupText;

