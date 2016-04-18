/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import {VBox, HBox}       from '../../layout';
import {WithFormValue}    from 'react-forms';
import ErrorList from './ErrorList';

let Style = {
  self: {
    marginBottom: 15,
    fontWeight: 400,
    marginTop: 10,
    marginLeft: 20,
    fontSize: '14px'
  },
  label: {
    textAlign: 'left',
    color: '#888',
    fontWeight: 400,
    fontSize: '14px',
  },
  value: {
    whiteSpace: 'pre-line'
  }
};

/**
 * Renders a read-only field as an <HBox>
 * with a <VBox> containing the ``label``,
 * and another <VBox> containing the value.
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
    label: PropTypes.string,

    /**
     * css style object.
     */
    style: PropTypes.object,

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
    renderValue: PropTypes.func,

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
    formValue: PropTypes.object,

    /**
     * The input element to use.
     */
    children: PropTypes.element,

    /**
     * Unitless number representing the amount of space the
     * <VBox> with the <label> uses
     * relative to all its sibling widgets.
     */
    labelSize: PropTypes.number,

    /**
     * Unitless number representing the amount of space the
     * <VBox> with the value uses
     * relative to all its sibling widgets.
     */
    inputSize: PropTypes.number
  };

  static defaultProps = {
    renderValue: renderValue,
    labelSize: 2,
    inputSize: 5
  };

  render() {
    let {
      label, style, renderValue,
      formValue, children, labelSize, inputSize
    } = this.props;
    if (children === undefined) {
      children = renderValue(formValue.value);
    }
    return (
      <HBox style={{...Style.self, ...(style && style.self)}}>
        {label &&
          <VBox flex={labelSize} justifyContent="flex-start">
            <label style={{...Style.label, ...(style && style.label)}}>
              {label}
            </label>
          </VBox>}
        <VBox flex={inputSize} justifyContent="flex-start" style={Style.value}>
          {children}
          {formValue.errorList.length > 0 &&
            <ErrorList errorList={formValue.errorList} />}
        </VBox>
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

export default WithFormValue(ReadOnlyField);
