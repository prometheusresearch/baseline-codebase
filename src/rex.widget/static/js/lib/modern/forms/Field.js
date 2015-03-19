/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React           = require('react/addons');
var cloneWithProps  = React.addons.cloneWithProps;
var {HBox, VBox}    = require('../Layout');
var Focusable       = require('../Focusable');

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

var InputStyle = {
  self: {
    display: 'block',
    width: '100%',
    height: '34px',
    padding: '6px 12px',
    fontSize: '14px',
    lineHeight: 1.42857143,
    color: '#555',
    backgroundColor: '#fff',
    backgroundImage: 'none',
    border: '1px solid #ccc',
    borderRadius: '2px',
    boxShadow: 'inset 0 1px 1px rgba(0,0,0,.075)',
    transition: 'border-color ease-in-out .15s,box-shadow ease-in-out .15s'
  }
}

var Input = React.createClass({

  render() {
    var {style, focus, ...props} = this.props;
    style = {...InputStyle.self, ...style};
    return <input {...props} style={style} />;
  },

  getDefaultProps() {
    return {type: "text"};
  }
});

Input = Focusable(Input);

var Field = React.createClass({

  render() {
    var {label, children, ...props} = this.props;
    var {dirty} = this.state;
    var {value, errors, params, schema} = this.props.formValue;
    var showErrors = dirty || params.forceShowErrors;
    children = cloneWithProps(
      children ?
        React.Children.only(children) :
        <Input />,
      {value, onChange: this.onChange});
    return (
      <VBox {...props} onBlur={this.onBlur} style={FieldStyle.self}>
        <HBox>
          {label &&
            <VBox size={1} centerVertically>
              <label>
                {label}
                {schema && schema.required ?
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
