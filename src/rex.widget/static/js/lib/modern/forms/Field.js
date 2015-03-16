/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React           = require('react/addons');
var cloneWithProps  = React.addons.cloneWithProps;
var {HBox, VBox}    = require('../Layout');

var FieldStyle = {
  self: {
    marginBottom: 5
  },
  requiredTag: {
    color: 'red',
    marginLeft: 3
  },
  errors: {
    marginTop: 3,
    color: 'red',
    fontSize: '90%'
  }
};

var Field = React.createClass({

  render() {
    var {label, children, ...props} = this.props;
    var {dirty} = this.state;
    var {value, errors, params, schema} = this.props.formValue;
    var showErrors = dirty || params.forceShowErrors;
    children = cloneWithProps(
      React.Children.only(children),
      {value, onChange: this.onChange});
    return (
      <VBox {...props} onBlur={this.onBlur} style={FieldStyle.self}>
        <HBox>
          {label &&
            <VBox size={1}>
              <label>
                {label}
                {schema.required ?
                  <span style={FieldStyle.requiredTag}>*</span> :
                  null}
              </label>
            </VBox>}
          <VBox size={3}>
            {children}
            {showErrors && errors &&
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
      children: <input type="text" />
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

  onChange(e) {
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
    this.setState({dirty: true});
    this.props.formValue.set(value);
  }

});

module.exports = Field;

