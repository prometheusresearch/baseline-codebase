/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React             = require('react/addons');
var {cloneWithProps}  = React.addons;
var {Box, HBox}       = require('./layout');
var Button            = require('./Button');
var merge             = require('./merge');

var FilterSet = React.createClass({

  render() {
    var {filters, applyOnChange, ...props} = this.props;
    filters = React.Children.map(filters, this._setupFilter);
    return (
      <HBox {...props}>
        <Box>
          <Button
            quiet
            size="small"
            icon="remove"
            onClick={this._clear}
            />
        </Box>
        <Box onKeyPress={this._onKeyPress}>
          {filters}
        </Box>
        {!applyOnChange &&
          <Box>
            <Button
              quiet
              size="small"
              icon="search"
              onClick={this._apply}
              />
          </Box>}
      </HBox>
    );
  },

  getDefaultProps() {
    return {
      width: '100%'
    };
  },

  getInitialState() {
    return {value: null};
  },

  _onKeyPress(e) {
    if (e.key === 'Enter') {
      this._apply();
    }
  },

  _clear() {
    this.props.onValue({});
    this.setState({value: null});
  },

  _apply() {
    this.props.onValue(this.state.value);
    this.setState({value: null});
  },

  _value() {
    var value = this.state.value !== null ?
      this.state.value :
      this.props.value;
    return value || {};
  },

  _setupFilter(filter) {
    return cloneWithProps(filter, {
      onValue: this._onValue,
      value: this._value()[filter.props.property]
    });
  },

  _onValue(property, propertyValue) {
    var nextValue = merge({}, this._value());
    if (propertyValue === '' || propertyValue == null) {
      delete nextValue[property];
    } else {
      nextValue[property] = propertyValue;
    }
    if (this.props.applyOnChange) {
      this.props.onValue(nextValue);
    } else {
      this.setState({value: nextValue});
    }
  }

});

module.exports = FilterSet;
