/**
 * @copyright 2015, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {HBox} from '../../layout';
import {withFormValue} from 'react-forms';
import ErrorList from './ErrorList';

let Style = {
  self: {
    maxWidth: 800,
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 20,
    marginRight: 20,
    fontWeight: 400,
    fontSize: '14px',
  },
  label: {
    textAlign: 'left',
    color: '#888',
    fontWeight: 400,
    fontSize: '14px',
  },
  value: {
    whiteSpace: 'pre-line',
  },
};

/**
 * Renders a read-only field.
 *
 * The value is ``children`` unless ``children === undefined``
 * in which case ``formValue.value`` is used.
 *
 * @public
 */
export class ReadOnlyField extends React.Component {
  static propTypes = {
    /**
     * The field label.
     */
    label: React.PropTypes.string,

    /**
     * css style object.
     */
    style: React.PropTypes.object,

    /**
     * func
     *
     * This function is used to convert formValue.value to
     * something renderable.
     *
     * The default function returns the input unchanged
     * when it is null or an element,
     * otherwise the input is converted to a String.
     *
     */
    renderValue: React.PropTypes.func,

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

    /**
     * The input element to use.
     */
    children: React.PropTypes.element,

    /**
     * Unitless number representing the amount of space the <label> uses
     * relative to all its sibling widgets.
     */
    labelSize: React.PropTypes.number,

    /**
     * Unitless number representing the amount of space the value uses
     * relative to all its sibling widgets.
     */
    inputSize: React.PropTypes.number,
  };

  static defaultProps = {
    renderValue: renderValue,
    labelSize: 2,
    inputSize: 5,
  };

  render() {
    let {
      label,
      style,
      renderValue,
      formValue,
      children,
      labelSize,
      inputSize,
    } = this.props;
    if (children === undefined) {
      children = renderValue(formValue.value);
    }
    const totalSize = labelSize + inputSize;
    const labelSizePercent = `${labelSize / totalSize * 100}%`;
    const inputSizePercent = `${inputSize / totalSize * 100}%`;
    return (
      <HBox style={{...Style.self, ...(style && style.self)}}>
        {label &&
          <ReactUI.Element padding={5} width={labelSizePercent}>
            <label style={{...Style.label, ...(style && style.label)}}>
              {label}
            </label>
          </ReactUI.Element>}
        <ReactUI.Element padding={5} width={inputSizePercent} style={Style.value}>
          {children}
          {formValue.errorList.length > 0 &&
            <ErrorList errorList={formValue.errorList} />}
        </ReactUI.Element>
      </HBox>
    );
  }
}

function renderValue(value) {
  if (value == null) {
    return value;
  } else if (value.type && value.props) {
    return value;
  } else {
    return String(value);
  }
}

export default withFormValue(ReadOnlyField);
