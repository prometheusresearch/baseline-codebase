/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {withFormValue} from 'react-forms';

import * as Theme from '../Theme';
import choose from '../choose';
import Input from './Input';
import ErrorList from './ErrorList';
import {RequiredSign, Hint} from './ui';

type Props = {
  label?: string,
  hint?: string,
  children: any,
  layout: 'horizontal' | 'vertical',
  onChange: Function,
  labelSize: number,
  inputSize: number,
  serialize: Function,
  deserialize: Function,
  formValue: any,
};

type State = {
  dirty: boolean,
};

/**
 * Field component.
 *
 * Base field component with <label>, <input>, hints, and error messages.
 *
 * @public
 */
export class Field extends React.Component {
  props: Props;
  state: State;

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

  constructor(props: Props) {
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
    // $FlowFixMe: ...
    children = React.cloneElement(children ? React.Children.only(children) : <Input />, {
      error: showErrors && errorList.length > 0,
      value: serialize(value),
      onChange: this.onChange.bind(null, onChange),
      onBlur: this.onBlur,
    });
    const totalSize = labelSize + inputSize;
    const labelSizePercent = `${labelSize / totalSize * 100}%`;
    const inputSizePercent = `${inputSize / totalSize * 100}%`;
    const labelSizeProps =
      layout === 'vertical' ? {height: labelSizePercent} : {width: labelSizePercent};
    const inputSizeProps =
      layout === 'vertical' ? {height: inputSizePercent} : {width: inputSizePercent};
    const verticalFieldSpacing = choose(
      Theme.form.verticalFieldSpacing,
      Theme.form.condensedLayout ? 0 : null,
      10,
    );
    const horizontalFieldSpacing = choose(
      Theme.form.horizontalFieldSpacing,
      Theme.form.condensedLayout ? 0 : null,
      20,
    );
    const padding = Theme.form.condensedLayout ? 0 : 5;
    return (
      <ReactUI.VBox
        marginTop={verticalFieldSpacing}
        marginBottom={verticalFieldSpacing}
        marginLeft={horizontalFieldSpacing}
        marginRight={horizontalFieldSpacing}
        {...props}>
        <ReactUI.VBox
          maxWidth={800}
          flexDirection={layout === 'vertical' ? 'column' : 'row'}>
          <ReactUI.Element padding={padding} {...labelSizeProps}>
            <ReactUI.HBox color="#888" fontSize="14px" fontWeight={400} textAlign="left">
              {label}
              {schema && schema.isRequired && <RequiredSign />}
              {showErrors && errorList.length > 0 && <ErrorList errorList={errorList} />}
            </ReactUI.HBox>
          </ReactUI.Element>
          <ReactUI.Element padding={padding} {...inputSizeProps}>
            {children}
            {hint && <Hint>{hint}</Hint>}
          </ReactUI.Element>
        </ReactUI.VBox>
      </ReactUI.VBox>
    );
  }

  onBlur = () => {
    if (!this.state.dirty) {
      this.setState({dirty: true});
    }
  };

  onChange = (onChange: Function, e: Event) => {
    let value;
    if (e && e.target && e.target.value !== undefined) {
      e.stopPropagation();
      value = (e.target: any).value;
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
