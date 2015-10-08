/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var Immutable = require('immutable');
var React = require('react');
var ReactSelect = require('react-select');


var DELIMITER = '|||';


var MultiSelect = React.createClass({
  propTypes: {
    choices: React.PropTypes.arrayOf(
      React.PropTypes.shape({
        value: React.PropTypes.any.isRequired,
        label: React.PropTypes.string.isRequired
      })
    ),
    allowCreate: React.PropTypes.bool
  },

  getDefaultProps: function () {
    return {
      allowCreate: false
    };
  },

  getInitialState: function () {
    return {
      value: null
    };
  },

  componentWillReceiveProps: function (nextProps) {
    this.setState({
      value: nextProps.value
    });
  },

  handleChange: function (newValue) {
    /*eslint new-cap: 0 */
    var value;
    if (newValue) {
      value = Immutable.List(newValue.split(DELIMITER));
    } else {
      value = Immutable.List();
    }

    this.setState({
      value
    }, () => {
      if (this.props.onChange) {
        this.props.onChange(value);
      }
    });
  },

  render: function () {
    var value = '';
    if (this.state.value && (this.state.value.count() > 0)) {
      value = this.state.value.join(DELIMITER);
    }

    return (
      <div className='rfb-multiselect'>
        <ReactSelect
          allowCreate={this.props.allowCreate}
          options={this.props.choices}
          onBlur={this.props.onBlur}
          onChange={this.handleChange}
          delimiter={DELIMITER}
          multi={true}
          value={value}
          />
      </div>
    );
  }
});


module.exports = MultiSelect;

