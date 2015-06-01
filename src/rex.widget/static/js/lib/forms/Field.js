/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React           = require('react/addons');
var cloneWithProps  = React.addons.cloneWithProps;
var {HBox, VBox}    = require('../Layout');
var Input           = require('./Input');

var FieldStyle = {
  self: {
    marginBottom: 5
  },
  requiredTag: {
    color: 'red',
    marginLeft: 3
  },
  label: {
    color: '#666',
    fontSize: '90%',
    textAlign: 'right',
    padding: '0px 7px',
    paddingTop: '10px',
    margin: 0
  },
  hint: {
    fontSize: '75%',
    padding: '0px 7px',
    textAlign: 'right'
  },
  errors: {
    marginTop: 3,
    color: 'red',
    fontSize: '80%'
  }
};

var Field = React.createClass({

  render() {
    var {label, hint, children, onChange, labelSize, inputSize, 
      serialize, ...props} = this.props;
    var {dirty} = this.state;
    var {value, errors, params, schema} = this.props.formValue;
    var showErrors = dirty || params.forceShowErrors;
    children = cloneWithProps(
      children ?  React.Children.only(children) : <Input />, {
        value: serialize(value),
        onChange: this.onChange.bind(null, onChange)
      });
    return (
      <VBox {...props} onBlur={this.onBlur} style={FieldStyle.self}>
        <HBox>
          {label &&
            <VBox size={labelSize}>
              <label style={FieldStyle.label}>
                {label}
                {schema && schema.isRequired ?
                  <span style={FieldStyle.requiredTag}>*</span> :
                  null}
              </label>
              {hint &&
                <div style={FieldStyle.hint}>
                  {hint}
                </div>}
            </VBox>}
          <VBox size={inputSize}>
            {children}
            {showErrors && errors.length > 0 &&
              <VBox style={FieldStyle.errors}>
                {errors.map((error, idx) =>
                  <VBox key={idx}>{error.message}</VBox>)}
              </VBox>}
          </VBox>
        </HBox>
      </VBox>
    );
  },

  getDefaultProps() {
    return {
      serialize: (value) => (value),
      deserialize: (value) => (value),
      labelSize: 2,
      inputSize: 5
    };
  },

  getInitialState() {
    return {
      dirty: false
    };
  },

  onBlur() {
    this.setState({dirty: true});
  },

  onChange(onChange, e) {
    var value;
    if (e && e.target && e.target.value !== undefined) {
      e.stopPropagation();
      value = e.target.value;
      if (value === '') {
        value = undefined;
      }
    } else {
      value = e;
    }
    value = this.props.deserialize(value);
    this.setState({dirty: true});
    if (onChange) {
      onChange(value);
    }
    this.props.formValue.set(value);
  }

});

module.exports = Field;
