/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import * as rexui from "rex-ui";
import { useFormValue, type value, type select } from "react-forms";
import { HBox, Element } from "react-stylesheet";
import choose from "../choose";
import { ErrorList } from "./ErrorList";

type Props = {
  /**
   * The field label.
   */
  label?: string,

  /**
   * css style object.
   */
  style?: Object,

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
  renderValue?: mixed => React.Node,

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
  formValue?: value,

  select?: select,

  /**
   * The input element to use.
   */
  children?: React.Node
};

/**
 * Renders a read-only field.
 *
 * The value is ``children`` unless ``children === undefined``
 * in which case ``formValue.value`` is used.
 *
 * @public
 */
function ReadOnlyField(props: Props) {
  let {
    label,
    renderValue = renderValueDefault,
    formValue: formValueOfProps,
    select,
    children
  } = props;

  let theme = rexui.useTheme();

  let formValue = useFormValue(formValueOfProps, select);

  if (renderValue != null) {
    children = renderValue(formValue.value);
  }

  let labelSizePercent = `30%`;
  let inputSizePercent = `70%`;
  let { verticalSpacing, horizontalSpacing } = theme.definitonList;
  let dimensions = { vertical: verticalSpacing, horizontal: horizontalSpacing };
  return (
    <HBox
      padding={dimensions}
      borderBottom={`1px solid ${mui.colors.grey.A200}`}
    >
      {label != null ? (
        <Element padding={dimensions} width={labelSizePercent}>
          <mui.FormLabel>{label}</mui.FormLabel>
        </Element>
      ) : null}
      <Element padding={dimensions} width={inputSizePercent}>
        {children}
        {formValue.errorList.length > 0 && (
          <ErrorList errorList={formValue.errorList} />
        )}
      </Element>
    </HBox>
  );
}

function renderValueDefault(value) {
  if (value == null) {
    return value;
  } else if (value.type && value.props) {
    return value;
  } else {
    return String(value);
  }
}

export default ReadOnlyField;
