/**
 * @copyright 2015, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {withFormValue} from 'react-forms';
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
    formValue: React.PropTypes.object,
  };

  static defaultProps = {
    serialize: value => value,
    deserialize: value => value,
    labelSize: 2,
    inputSize: 5,
    layout: 'vertical',
  };

  constructor(props) {
    super(props);
    this.state = {
      dirty: false,
    };
  }

  render() {
    let {
      label,
      hint,
      children,
      onChange,
      labelSize,
      inputSize,
      serialize,
      layout,
      ...props
    } = this.props;
    let {dirty} = this.state;
    let {value, errorList, params, schema} = this.props.formValue;
    let showErrors = dirty || params.forceShowErrors;
    children = React.cloneElement(children ? React.Children.only(children) : <Input />, {
      error: showErrors && errorList.length > 0,
      value: serialize(value),
      onChange: this.onChange.bind(null, onChange),
      onBlur: this.onBlur,
    });
    return (
      <ReactUI.VBox marginBottom={10} marginLeft={20} marginRight={20} {...props}>
        <ReactUI.VBox
          padding={5}
          flexDirection={layout === 'vertical' ? 'column' : 'row'}>
          <ReactUI.VBox flexGrow={labelSize}>
            <ReactUI.HBox
              color="#888"
              fontSize="14px"
              fontWeight={400}
              textAlign="left"
              padding="0px 7px"
              paddingTop={10}
              paddingBottom={5}
              marginLeft={-7}>
              {label}
              {schema && schema.isRequired && <RequiredSign />}
              {showErrors && errorList.length > 0 && <ErrorList errorList={errorList} />}
            </ReactUI.HBox>
          </ReactUI.VBox>
          <ReactUI.VBox justifyContent="center" flexGrow={inputSize}>
            {children}
            {hint && <Hint>{hint}</Hint>}
          </ReactUI.VBox>
        </ReactUI.VBox>
      </ReactUI.VBox>
    );
  }

  onBlur = () => {
    if (!this.state.dirty) {
      this.setState({dirty: true});
    }
  };

  onChange = (onChange, e) => {
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
    this.setState({dirty: true});
  };
}

export default withFormValue(Field);
