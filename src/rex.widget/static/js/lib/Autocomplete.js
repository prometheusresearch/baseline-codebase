/**
 * @jsx React.DOM
 */
'use strict';

var React             = require('react');
var PropTypes         = React.PropTypes;
var ReactAutocomplete = require('react-autocomplete');

var Autocomplete = React.createClass({

  propTypes: {
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    onValue: PropTypes.func,
    options: PropTypes.array
  },

  render() {
    var {options, data, value, placeholder} = this.props;
    options = options || [];
    if (data && data.data) {
      options = options.concat(data.data);
    }
    return (
      <ReactAutocomplete
        className={this.props.className}
        placeholder={placeholder}
        value={{id: value}}
        options={options}
        onChange={this.onChange}
        />
    );
  },

  getDefaultProps() {
    return {options: [], data: null};
  },

  onChange({id}) {
    this.props.onValue(id);
  }
});

module.exports = Autocomplete;
