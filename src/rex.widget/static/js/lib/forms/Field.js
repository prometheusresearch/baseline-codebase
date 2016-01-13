/**
 * @copyright 2015, Prometheus Research, LLC
 */

import debounce from 'lodash/function/debounce';
import autobind from 'autobind-decorator';
import React from 'react';
import {WithFormValue} from 'react-forms';
import {HBox, VBox} from '../../layout';
import Input from './Input';

let FieldStyle = {
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
  errorList: {
    marginTop: 3,
    color: 'red',
    fontSize: '80%'
  }
};

/**
 * Field component.
 *
 * Base field component with <label>, <input>, hints, and error messages.
 *
 * @public
 */
@WithFormValue
export default class Field extends React.Component {

  static propTypes = {
    /**
     * The field label.
     */
    label: React.PropTypes.string,

    /**
     * The text to appear when the mouse hovers over the field.
     */
    hint: React.PropTypes.string,

    /**
     * The input element to use.
     */
    children: React.PropTypes.element,

    /**
     * func
     *
     * The callback which fires when the field is changed.
     */
    onChange: React.PropTypes.func,

    /**
     * Unitless number representing the amount of space the <label> uses
     * relative to all its sibling widgets.
     */
    labelSize: React.PropTypes.number,

    /**
     * Unitless number representing the amount of space the <input> uses
     * relative to all its sibling widgets.
     */
    inputSize: React.PropTypes.number,

    /**
     * func
     *
     * serialize the field value.
     */
    serialize: React.PropTypes.func,

    /**
     * func
     *
     * deserialize the field value.
     */
    deserialize: React.PropTypes.func,

    /**
     * Form value.
     *
     * It has the following properties:
     *
     * - ``value`` represents the current value at the field
     * - ``errorList`` represents the list of validation errors
     * - ``schema`` schema node at field (if present)
     *
     * See React Forms docs for more info.
     */
    formValue: React.PropTypes.object
  };

  static defaultProps = {
    serialize: (value) => (value),
    deserialize: (value) => (value),
    labelSize: 2,
    inputSize: 5
  };

  constructor(props) {
    super(props);
    this._validateStart = debounce(this._validateStart, 500);
    this.state = {
      dirty: false
    };
  }

  render() {
    let {label, hint, children, onChange, labelSize, inputSize,
      serialize, ...props} = this.props;
    let {dirty} = this.state;
    let {value, errorList, params, schema} = this.props.formValue;
    let showErrors = dirty || params.forceShowErrors;
    children = React.cloneElement(
      children ?  React.Children.only(children) : <Input />, {
        error: showErrors && errorList.length > 0,
        value: serialize(value),
        onChange: this.onChange.bind(null, onChange)
      });
    return (
      <VBox {...props} onBlur={this.onBlur} style={FieldStyle.self}>
        <HBox>
          {label &&
            <VBox flex={labelSize}>
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
          <VBox flex={inputSize}>
            {children}
            {showErrors && errorList.length > 0 &&
              <VBox style={FieldStyle.errorList}>
                {errorList.map((error, idx) =>
                  <VBox key={idx}>{error.message}</VBox>)}
              </VBox>}
          </VBox>
        </HBox>
      </VBox>
    );
  }

  @autobind
  onBlur() {
    if (!this.state.dirty) {
      this.setState({dirty: true});
    }
  }

  @autobind
  onChange(onChange, e) {
    let value;
    if (e && e.target && e.target.value !== undefined) {
      e.stopPropagation();
      value = e.target.value;
      if (value === '') {
        value = null;
      }
    } else {
      value = e;
    }
    value = this.props.deserialize(value);
    this.setState({dirty: true});
    if (onChange) {
      onChange(value);
    }
    this.props.formValue.update(value);
    if (this.props.validate) {
      this._validateStart(value);
    }
  }

  _validateStart(value) {
    this.props.validate.produce({value}).then(
      this._onValidateComplete,
      this._onValidateError);
  }

  @autobind
  _onValidateComplete(value) {
    let firstKey = Object.keys(value)[0];
    value = value[firstKey];

    let formValue = this.props.formValue;
    let error = formValue.errorList.find(error => error.rexWidgetError);
    if (value !== null) {
      formValue = formValue.removeError(error, true);
      formValue = formValue.addError({
        message: String(value),
        rexWidgetError: true,
      });
    } else {
      formValue = formValue.removeError(error);
    }
  }

  @autobind
  _onValidateError(error) {
    // FIXME: What to do? Render into errorList?
    console.error(error);
  }

}
