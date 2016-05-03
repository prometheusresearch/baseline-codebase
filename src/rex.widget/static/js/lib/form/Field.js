/**
 * @copyright 2015, Prometheus Research, LLC
 */

import debounce from 'lodash/function/debounce';
import autobind from 'autobind-decorator';
import React from 'react';
import {WithFormValue} from 'react-forms';
import {VBox, HBox} from '../../layout';
import * as Stylesheet from '../../stylesheet';
import Input from './Input';
import ErrorList from './ErrorList';
import {RequiredSign, Hint} from './ui';

/**
 * Field component.
 *
 * Base field component with <label>, <input>, hints, and error messages.
 *
 * @public
 */
export class Field extends React.Component {

  static stylesheet = Stylesheet.create({
    Root: {
      Component: VBox,
      marginBottom: 10,
      marginLeft: 20,
      marginRight: 20,
    },
    Label: {
      Component: HBox,
      color: '#888',
      fontSize: '14px',
      fontWeight: 400,
      textAlign: 'left',
      padding: '0px 7px',
      paddingTop: 10,
      paddingBottom: 5,
      marginLeft: -7,
    },
    Hint: Hint,
    InputWrapper: {
      Component: VBox,
      justifyContent: 'center',
    }
  });

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
     *
     */
    layout: React.PropTypes.oneOf(['horizontal', 'vertical']),

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
    inputSize: 5,
    debounceValidation: 500,
    layout: 'vertical',
  };

  constructor(props) {
    super(props);
    this._validate = debounce(this._validate, props.debounceValidation);
    this.state = {
      dirty: false
    };
  }

  render() {
    let {Root, Label, Hint, InputWrapper} = this.constructor.stylesheet;
    let {
      label, hint, children, onChange, labelSize, inputSize,
      serialize, layout, ...props
    } = this.props;
    let {dirty} = this.state;
    let {value, errorList, params, schema} = this.props.formValue;
    let showErrors = dirty || params.forceShowErrors;
    children = React.cloneElement(
      children ?  React.Children.only(children) : <Input />, {
        error: showErrors && errorList.length > 0,
        value: serialize(value),
        onChange: this.onChange.bind(null, onChange),
        onBlur: this.onBlur,
      });
    return (
      <Root {...props}>
        <VBox direction={layout === 'vertical' ? 'column' : 'row'}>
          <VBox flex={labelSize}>
            <Label>
              {label}
              {schema && schema.isRequired && <RequiredSign />}
              {showErrors && errorList.length > 0 &&
                <ErrorList errorList={errorList} />}
            </Label>
          </VBox>
          <InputWrapper flex={inputSize}>
            {children}
            {hint && <Hint>{hint}</Hint>}
          </InputWrapper>
        </VBox>
      </Root>
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
    if (onChange) {
      onChange(value);
    }
    this.props.formValue.update(value);
    if (this.props.validate) {
      this._validate(value);
    }
    this.setState({dirty: true});
  }

  _validate(value) {
    let formValue = this.props.formValue;
    let context = formValue.params.context;
    let params = {};
    for (let key in context) {
      if (context.hasOwnProperty(key)) {
        let value = context[key];
        if (value['meta:type'] !== undefined) {
          params[key] = value.id;
        } else {
          params[key] = value;
        }
      }
    }
    if (formValue.parent) {
      params.id = formValue.parent.value.id || null;
    }
    params.value = value;
    this.props.validate.produce(params).then(
      this._onValidateComplete.bind(null, value),
      this._onValidateError);
  }

  @autobind
  _onValidateComplete(value, result) {
    let formValue = this.props.formValue;

    if (value !== formValue.value) {
      return;
    }

    let firstKey = Object.keys(result)[0];
    result = result[firstKey];

    let error = formValue.errorList.find(error => error.rexWidgetError);
    if (result !== null) {
      formValue = formValue.removeError(error, true);
      formValue = formValue.addError({
        message: String(result),
        rexWidgetError: true,
      });
    } else {
      formValue = formValue.removeError(error);
    }
  }

  @autobind
  _onValidateError(error) {
    // FIXME: What to do? Render into errorList?
    /* istanbul ignore next */
    console.error(error); // eslint-disable-line no-console
  }

}

export default WithFormValue(Field);
