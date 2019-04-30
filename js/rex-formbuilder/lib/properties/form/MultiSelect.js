/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var Immutable = require('immutable');
var React = require('react');
var ReactCreateClass = require('create-react-class');
var PropTypes = require('prop-types');
var ReactSelect = require('react-select');


var DELIMITER = '|||';


var MultiSelect = ReactCreateClass({
  propTypes: {
    choices: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.any.isRequired,
        label: PropTypes.string.isRequired
      })
    ),
    allowCreate: PropTypes.bool
  },

  getDefaultProps: function () {
    return {
      choices: [],
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
    var choices = this.props.choices.slice();

    var value = '';
    if (this.state.value && (this.state.value.count() > 0)) {
      value = this.state.value.join(DELIMITER);

      // If a value isn't in the list of choices, shove it in there.
      this.state.value.forEach((val) => {
        var exists = choices.filter((choice) => {
          choice.value === val;
        }) > 0;
        if (!exists) {
          choices.push({value: val, label: val});
        }
      });
    }

    var Selector = this.props.allowCreate ? ReactSelect.Creatable : ReactSelect;

    return (
      <div className="rfb-multiselect">
        <Selector
          options={choices}
          onBlur={this.props.onBlur}
          onChange={this.handleChange}
          simpleValue={true}
          joinValues={true}
          delimiter={DELIMITER}
          multi={true}
          value={value}
          />
      </div>
    );
  }
});


module.exports = MultiSelect;

