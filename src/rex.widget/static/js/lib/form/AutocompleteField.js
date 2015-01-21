/**
 * @copyright Prometheus Research, LLC 2014
 */
'use strict';

var React             = require('react/addons');
var cx                = React.addons.classSet;
var ReactAutocomplete = require('react-autocomplete');
var ReactForms        = require('react-forms');
var Element           = require('../layout/Element');
var runtime           = require('../runtime');
var invariant         = require('../invariant');
var FormContextMixin  = require('./FormContextMixin');
var FieldBase         = require('./FieldBase');

var AutocompleteInput = React.createClass({

  render() {
    var {value, data, titleAttribute, valueAttribute, ...props} = this.props;
    var {options} = this.state;
    options = options.map(option =>
      <ReactAutocomplete.Option key={option.value} value={option.value}>
        {option.title}
      </ReactAutocomplete.Option>
    );
    return (
      <Element>
        <ReactAutocomplete.Combobox
          ref="underlying"
          autocomplete="both"
          value={value}
          onInput={this.onInput}
          onSelect={this.onSelect}>
          {options}
        </ReactAutocomplete.Combobox>
      </Element>
    );
  },

  getInitialState() {
    return {options: []};
  },

  componentDidMount() {
    var {value} = this.props;
    if (value) {
      var params = {};
      var {refs, filter, data} = this.props.data;
      for (var key in refs) {
        params[key] = ApplicationState.get(refs[key]);
      }
      params[filter.replace(/\..+$/, '')] = value;
      this._getPort()
        .produce(params)
        .then(this._onRequestOptionsComplete, this._onRequestOptionsError)
        .then(this._fixInputValue);
    }
  },

  /**
   * Because react-autocomplete doesn't update its input value we need to fix it
   * manually.
   */
  _fixInputValue() {
    var inputValue = this.refs.underlying.findInitialInputValue();
    this.refs.underlying.setState({inputValue});
  },

  _getPort() {
    var {data} = this.props.data;
    return runtime.Storage.createPort(data);
  },

  _requestOptions(value) {
    var params = {};
    var {refs, filter, data} = this.props.data;
    for (var key in refs) {
      params[key] = ApplicationState.get(refs[key]);
    }
    params[`${filter}:contains`] = value;
    this._getPort()
      .produce(params)
      .then(this._onRequestOptionsComplete, this._onRequestOptionsError);
  },

  _onRequestOptionsComplete(data) {
    var keys = Object.keys(data);
    invariant(keys.length === 1);
    var key = keys[0];
    var options = data[key];
    var {valueAttribute, titleAttribute} = this.props;
    options = options.map(option => ({
      value: valueAttribute ? option[valueAttribute] : option.id,
      title: titleAttribute ? option[titleAttribute] : option.title
    }));
    this.setState({options});
  },

  _onRequestOptionsError(error) {
    // TODO: handle error properly
    console.error(error);
  },

  onSelect(value) {
    this.props.onChange(value);
  },

  onInput(value) {
    this._requestOptions(value);
  }

});

var AutocompleteField = React.createClass({

  render() {
    var {className, data, titleAttribute, valueAttribute, ...props} = this.props;
    var input = (
      <AutocompleteInput
        data={data}
        titleAttribute={titleAttribute}
        valueAttribute={valueAttribute}
        />
    );
    return (
      <FieldBase
        {...props}
        input={input}
        className={cx('rw-AutocompleteField', className)}
        />
    );
  }
});

module.exports = AutocompleteField;
